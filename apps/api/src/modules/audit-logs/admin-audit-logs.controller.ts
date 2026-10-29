import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { UserRole } from '../../generated/prisma/enums';
import { AuditLogsService } from './audit-logs.service';
import {
  AuditLogFilterDto,
  AuditLogQueryDto,
} from './dto/admin/audit-log-filter.dto';

@ApiTags('Admin audit logs')
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) { }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.AUDIT_LOGS_READ],
  })
  async list(@Query() query: AuditLogQueryDto) {
    const { items, pagination } = await this.auditLogs.list(query);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Get('filter-options')
  @Header('Cache-Control', 'no-store')
  @Auth({ roles: [RoleEnum.ADMIN], permissions: [PermissionEnum.AUDIT_LOGS_READ] })
  async filterOptions(@Query() filter: AuditLogFilterDto) {
    return new HttpResponseBodySuccessDto(await this.auditLogs.filterOptions(filter));
  }

  @Post('export')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [
      PermissionEnum.AUDIT_LOGS_READ,
      PermissionEnum.AUDIT_LOGS_EXPORT,
    ],
  })
  async export(
    @Body() filter: AuditLogFilterDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    const file = await this.auditLogs.export(filter, {
      type: 'USER',
      id: actor.id,
      name: actor.name,
      role: UserRole.ADMIN,
    });
    return new StreamableFile(file, {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="audit-logs.csv"',
    });
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.AUDIT_LOGS_READ],
  })
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.auditLogs.get(id));
  }
}
