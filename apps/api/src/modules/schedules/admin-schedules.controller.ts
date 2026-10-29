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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto as ApiResponseDto } from '../../common/dto/http-response-body-success.dto';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { SchedulesService } from './schedules.service';
import { ApproveLeaveRequestDto } from './dto/admin/approve-leave-request.dto';
import { CreateWorkScheduleDto } from './dto/admin/create-work-schedule.dto';
import { CreateWorkSchedulesDto } from './dto/admin/create-work-schedules.dto';
import { LeaveRequestQueryDto } from './dto/admin/leave-request-query.dto';
import { RejectLeaveRequestDto } from './dto/admin/reject-leave-request.dto';
import { WorkScheduleQueryDto } from './dto/admin/work-schedule-query.dto';

@ApiTags('Admin schedules')
@Controller('admin/work-schedules')
@AuthRole(RoleEnum.ADMIN)
@AuthPermission(PermissionEnum.SCHEDULES_MANAGE)
export class AdminSchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOkResponse({ description: 'Lists weekly work schedule rules.' })
  async list(@Query() query: WorkScheduleQueryDto) {
    return new ApiResponseDto(
      await this.schedulesService.listWorkSchedules(query),
    );
  }

  @Post()
  async create(
    @Body() input: CreateWorkScheduleDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.createWorkSchedule(input, user),
    );
  }

  @Post('bulk')
  async createBulk(
    @Body() input: CreateWorkSchedulesDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.createWorkSchedules(input, user),
    );
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(await this.schedulesService.getWorkSchedule(id));
  }

  @Post(':id/publish')
  async publish(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.publishWorkSchedule(id, user),
    );
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(
      await this.schedulesService.cancelWorkSchedule(id),
    );
  }

  @Post(':id/delete')
  async delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(
      await this.schedulesService.cancelWorkSchedule(id),
    );
  }
}

@ApiTags('Admin leave requests')
@Controller('admin/leave-requests')
@AuthRole(RoleEnum.ADMIN)
@AuthPermission(PermissionEnum.LEAVE_REQUESTS_REVIEW)
export class AdminLeaveRequestsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list(@Query() query: LeaveRequestQueryDto) {
    return new ApiResponseDto(
      await this.schedulesService.listLeaveRequests(query),
    );
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(await this.schedulesService.getLeaveRequest(id));
  }

  @Get(':id/impact')
  async impact(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(await this.schedulesService.getLeaveImpact(id));
  }

  @Get(':id/reassignment-preview')
  async reassignmentPreview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.getReassignmentPreview(id),
    );
  }

  @Post(':id/approve')
  async approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ApproveLeaveRequestDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.approveLeaveRequest(id, input, user),
    );
  }

  @Post(':id/reject')
  async reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: RejectLeaveRequestDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.rejectLeaveRequest(id, input, user),
    );
  }
}
