import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';
import { Auth } from '../../authentication/decorators/auth.decorator';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { RoleEnum } from '../constants/roles.constant';
import { CurrentUserDto } from '../dto/responses/current-user.dto';
import { CreateUserDto } from '../dto/admin/create-user.dto';
import { UpdateUserDto } from '../dto/admin/update-user.dto';
import { UpdateUserStatusDto } from '../dto/admin/update-user-status.dto';
import { UserQueryDto } from '../dto/admin/user-query.dto';
import { AdminUsersService } from '../services/admin-users.service';
import { UsersService } from '../services/users.service';
import { StaffEmailPreviewDto } from '../dto/admin/staff-email-preview.dto';

@ApiTags('Admin users')
@Controller('admin/users')
@Auth({ roles: [RoleEnum.ADMIN] })
export class AdminUsersController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly accounts: UsersService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @Auth({ permissions: [PermissionEnum.USERS_READ] })
  async list(
    @Query() query: UserQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    const { items, pagination } = await this.users.list(query, actor);
    return new HttpResponseBodySuccessDto(items, pagination);
  }
  @Get('filter-options')
  @Header('Cache-Control', 'no-store')
  @Auth({ permissions: [PermissionEnum.USERS_READ] })
  async options() {
    return new HttpResponseBodySuccessDto(await this.users.options());
  }
  @Get('email-preview')
  @Header('Cache-Control', 'no-store')
  @Auth({ permissions: [PermissionEnum.USERS_WRITE] })
  async emailPreview(@Query() query: StaffEmailPreviewDto) {
    return new HttpResponseBodySuccessDto(
      await this.accounts.previewStaffEmail(query.fullName),
    );
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @Auth({ permissions: [PermissionEnum.USERS_READ] })
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(await this.users.get(id, actor));
  }
  @Post()
  @Auth({
    permissions: [PermissionEnum.USERS_WRITE, PermissionEnum.USERS_ASSIGN_ROLE],
  })
  async create(
    @Body() input: CreateUserDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.users.create(input, actor),
    );
  }
  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  @Auth({ permissions: [PermissionEnum.USERS_WRITE] })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateUserDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.users.update(id, input, actor),
    );
  }
  @Patch(':id/status')
  @Auth({ permissions: [PermissionEnum.USERS_LOCK] })
  async status(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateUserStatusDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.users.status(id, input, actor),
    );
  }
}
