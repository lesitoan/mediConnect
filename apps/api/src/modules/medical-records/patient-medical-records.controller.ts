import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { ConsultationQueryDto } from './dto/patient/consultation-query.dto';
import { MedicalRecordQueryDto } from './dto/patient/medical-record-query.dto';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('My medical records')
@Controller('me')
@Auth({
  roles: [RoleEnum.PATIENT],
  permissions: [PermissionEnum.MEDICAL_RECORDS_READ_ME],
})
export class PatientMedicalRecordsController {
  constructor(private readonly records: MedicalRecordsService) {}

  @Get('medical-records')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Xem tiền sử bệnh và dị ứng của chính mình' })
  async listRecords(
    @Query() query: MedicalRecordQueryDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    const { items, pagination } = await this.records.listRecords(query, user);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Get('consultations')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Xem lịch sử khám đã hoàn tất và khóa của chính mình',
  })
  async listConsultations(
    @Query() query: ConsultationQueryDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    const { items, pagination } = await this.records.listConsultations(
      query,
      user,
    );
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Get('consultations/:id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Xem chi tiết một lần khám đã hoàn tất và khóa' })
  async getConsultation(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.records.getConsultation(id, user),
    );
  }
}
