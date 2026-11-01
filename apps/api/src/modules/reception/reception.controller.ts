import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import {
  PatientSearchQueryDto,
  ReceptionAppointmentsQueryDto,
  ReceptionQueueQueryDto,
  WalkInDto,
} from './dto/reception.dto';
import { ReceptionService } from './reception.service';

@ApiTags('Reception')
@AuthRole(RoleEnum.RECEPTIONIST, RoleEnum.ADMIN)
@Controller('reception')
export class ReceptionController {
  constructor(private readonly reception: ReceptionService) {}

  @Get('appointments')
  @ApiOperation({ summary: 'Danh sách lịch hẹn theo ngày cho quầy tiếp nhận' })
  async listAppointments(@Query() query: ReceptionAppointmentsQueryDto) {
    return new HttpResponseBodySuccessDto(
      await this.reception.listAppointments(query),
    );
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Chi tiết lịch hẹn để xác nhận check-in' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async getAppointment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.reception.getAppointment(id),
    );
  }

  @Post('appointments/:id/check-in')
  @ApiOperation({ summary: 'Check-in và cấp số thứ tự cho lịch hẹn' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async checkIn(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.reception.checkIn(id, user),
    );
  }

  @Get('queue')
  @ApiOperation({ summary: 'Danh sách hàng chờ theo chuyên khoa và ngày' })
  async queue(@Query() query: ReceptionQueueQueryDto) {
    return new HttpResponseBodySuccessDto(await this.reception.queue(query));
  }

  @Get('appointments/:id/ticket')
  @ApiOperation({ summary: 'Dữ liệu phiếu khám' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async ticket(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.reception.ticket(id));
  }

  @Get('patients/search')
  @ApiOperation({ summary: 'Tra cứu hồ sơ bệnh nhân tại quầy' })
  async searchPatients(@Query() query: PatientSearchQueryDto) {
    return new HttpResponseBodySuccessDto(
      await this.reception.searchPatients(query.q),
    );
  }

  @Get('walk-in/slots')
  @ApiOperation({ summary: 'Khung giờ còn trống cho tiếp nhận vãng lai' })
  async walkInSlots(@Query() query: ReceptionAppointmentsQueryDto) {
    return new HttpResponseBodySuccessDto(
      await this.reception.walkInSlots(query),
    );
  }

  @Post('walk-in')
  @ApiOperation({ summary: 'Tạo lịch vãng lai và tùy chọn check-in ngay' })
  async walkIn(@Body() input: WalkInDto, @CurrentUser() user: CurrentUserDto) {
    return new HttpResponseBodySuccessDto(
      await this.reception.walkIn(input, user),
    );
  }
}
