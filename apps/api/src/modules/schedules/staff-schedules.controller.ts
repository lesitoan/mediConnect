import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto as ApiResponseDto } from '../../common/dto/http-response-body-success.dto';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { SchedulesService } from './schedules.service';
import { CreateLeaveRequestDto } from './dto/staff/create-leave-request.dto';

@ApiTags('Staff schedules')
@Controller('me/work-schedules')
@AuthRole(RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
@AuthPermission(PermissionEnum.SCHEDULES_READ)
export class StaffSchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserDto) {
    return new ApiResponseDto(
      await this.schedulesService.listOwnWorkSchedules(user),
    );
  }
}

@ApiTags('Staff leave requests')
@Controller('me/leave-requests')
@AuthRole(RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
@AuthPermission(
  PermissionEnum.LEAVE_REQUESTS_READ,
  PermissionEnum.LEAVE_REQUESTS_CREATE,
)
export class StaffLeaveRequestsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserDto) {
    return new ApiResponseDto(
      await this.schedulesService.listOwnLeaveRequests(user),
    );
  }

  @Post()
  async create(
    @Body() input: CreateLeaveRequestDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.createLeaveRequest(input, user),
    );
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.cancelOwnLeaveRequest(id, user),
    );
  }
}
