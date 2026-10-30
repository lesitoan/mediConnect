import {
  Body,
  Controller,
  Get,
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
import { RoleEnum } from '../../users/constants/roles.constant';
import { CurrentUserDto } from '../../users/dto/responses/current-user.dto';
import { CreateSpecialtyDto } from '../dto/admin/create-specialty.dto';
import { UpdateSpecialtyDto } from '../dto/admin/update-specialty.dto';
import { SpecialtyStatusDto } from '../dto/admin/specialty-status.dto';
import { SpecialtyQueryDto } from '../dto/specialty-query.dto';
import { SpecialtiesService } from '../specialties.service';

@ApiTags('Admin specialties')
@Controller('admin/specialties')
export class AdminSpecialtiesController {
  constructor(private readonly specialties: SpecialtiesService) {}

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_READ],
  })
  @Get()
  async list(@Query() query: SpecialtyQueryDto) {
    const { items, pagination } = await this.specialties.list(query, true);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_READ],
  })
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.specialties.get(id, true));
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_WRITE],
  })
  @Post()
  async create(
    @Body() input: CreateSpecialtyDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.specialties.create(input, actor),
    );
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_WRITE],
  })
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateSpecialtyDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.specialties.update(id, input, actor),
    );
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_WRITE],
  })
  @Patch(':id/status')
  async setStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: SpecialtyStatusDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.specialties.setStatus(id, input.isActive, actor),
    );
  }
}
