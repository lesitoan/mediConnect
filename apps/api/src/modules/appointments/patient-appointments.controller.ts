import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto as ApiResponseDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { Public } from '../authentication/decorators/public.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { SchedulesService } from '../schedules/schedules.service';
import { AppointmentsService } from './appointments.service';
import { AvailabilityQueryDto } from './dto/patient/availability-query.dto';
import { BookAppointmentDto } from './dto/patient/book-appointment.dto';
import { CancelAppointmentDto } from './dto/patient/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/patient/reschedule-appointment.dto';

@ApiTags('Patient appointments')
@Controller()
@AuthRole(RoleEnum.PATIENT)
export class PatientAppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get('appointments/availability')
  @Public()
  async availability(@Query() query: AvailabilityQueryDto) {
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(query.date));
    return new ApiResponseDto(
      await this.schedulesService.availability({
        dateFrom: date,
        dateTo: date,
        page: 1,
        limit: 50,
        ...(query.doctorId ? { doctorId: query.doctorId } : {}),
        ...(query.specialtyId ? { specialtyId: query.specialtyId } : {}),
      }),
    );
  }

  @Post('me/appointments')
  async book(
    @Body() input: BookAppointmentDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(await this.appointmentsService.book(input, user));
  }

  @Get('me/appointments')
  async list(@CurrentUser() user: CurrentUserDto) {
    return new ApiResponseDto(await this.appointmentsService.listMine(user));
  }

  @Get('me/appointments/:id')
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(await this.appointmentsService.getMine(id, user));
  }

  @Post('me/appointments/:id/reschedule')
  async reschedule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: RescheduleAppointmentDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.appointmentsService.reschedule(id, input, user),
    );
  }

  @Post('me/appointments/:id/cancel')
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CancelAppointmentDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.appointmentsService.cancel(id, input, user),
    );
  }
}
