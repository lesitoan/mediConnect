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
import { ConfirmReassignmentDto } from './dto/admin/confirm-reassignment.dto';
import { ResolveScheduleExceptionDto } from './dto/admin/resolve-schedule-exception.dto';

@ApiTags('Admin schedule exceptions')
@Controller('admin/schedule-exceptions')
@AuthRole(RoleEnum.ADMIN)
@AuthPermission(PermissionEnum.SCHEDULE_EXCEPTIONS_REVIEW)
export class AdminScheduleExceptionsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list() {
    return new ApiResponseDto(
      await this.schedulesService.listScheduleExceptions(),
    );
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new ApiResponseDto(
      await this.schedulesService.getScheduleException(id),
    );
  }

  @Post(':id/confirm')
  async confirm(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ConfirmReassignmentDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.confirmReassignment(id, input, user),
    );
  }

  @Post(':id/reschedule')
  async reschedule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ResolveScheduleExceptionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.markExceptionForReschedule(id, input, user),
    );
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: ResolveScheduleExceptionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.cancelScheduleException(id, input, user),
    );
  }
}
