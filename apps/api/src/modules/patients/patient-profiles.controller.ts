import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { PatientsService } from './patients.service';

@ApiTags('My patient profile')
@Controller('me/patient-profile')
export class PatientProfilesController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @Auth({
    roles: [RoleEnum.PATIENT],
    permissions: [PermissionEnum.PATIENTS_READ_ME],
  })
  @ApiOperation({ summary: 'Xem hồ sơ cá nhân của bệnh nhân đang đăng nhập' })
  async get(@CurrentUser() user: CurrentUserDto) {
    return new HttpResponseBodySuccessDto(await this.patients.getMine(user));
  }
}
