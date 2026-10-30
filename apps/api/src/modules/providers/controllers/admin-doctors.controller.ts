import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';
import { Auth } from '../../authentication/decorators/auth.decorator';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { RoleEnum } from '../../users/constants/roles.constant';
import { CurrentUserDto } from '../../users/dto/responses/current-user.dto';
import { CreateDoctorDto } from '../dto/admin/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/admin/update-doctor.dto';
import { DoctorQueryDto } from '../dto/doctor-query.dto';
import { CreateDoctorPauseDto } from '../dto/admin/create-doctor-pause.dto';
import { ProvidersService } from '../providers.service';
import { DoctorPauseConflictFilter } from '../doctor-pause-conflict.exception';

@ApiTags('Admin doctors')
@Controller('admin/doctors')
export class AdminDoctorsController {
  constructor(private readonly providers: ProvidersService) {}

  @Auth({ roles: [RoleEnum.ADMIN], permissions: [PermissionEnum.DOCTORS_READ] })
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@Query() query: DoctorQueryDto) {
    const { items, pagination } = await this.providers.list(query, true);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.SPECIALTIES_READ],
  })
  @Get('specialties')
  async specialties() {
    return new HttpResponseBodySuccessDto(
      await this.providers.listSpecialties(),
    );
  }

  @Auth({ roles: [RoleEnum.ADMIN], permissions: [PermissionEnum.DOCTORS_READ] })
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.providers.get(id, true));
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.DOCTORS_WRITE, PermissionEnum.USERS_WRITE],
  })
  @Post()
  async create(
    @Body() input: CreateDoctorDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.providers.create(input, actor),
    );
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.DOCTORS_WRITE],
  })
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: UpdateDoctorDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.providers.update(id, input, actor),
    );
  }

  @Auth({ roles: [RoleEnum.ADMIN], permissions: [PermissionEnum.DOCTORS_READ] })
  @Get(':id/pauses')
  @Header('Cache-Control', 'no-store')
  async pauses(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.providers.listPauses(id));
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [
      PermissionEnum.DOCTORS_WRITE,
      PermissionEnum.APPOINTMENTS_READ,
    ],
  })
  @Post(':id/pauses')
  @UseFilters(DoctorPauseConflictFilter)
  @ApiConflictResponse({
    description:
      'Affected appointments are returned in affectedAppointments; other pause conflicts return a message.',
  })
  async pause(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CreateDoctorPauseDto,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.providers.createPause(id, input, actor),
    );
  }

  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.DOCTORS_WRITE],
  })
  @Delete(':id/pauses/:pauseId')
  async cancelPause(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('pauseId', new ParseUUIDPipe({ version: '4' })) pauseId: string,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.providers.cancelPause(id, pauseId, actor),
    );
  }
}
