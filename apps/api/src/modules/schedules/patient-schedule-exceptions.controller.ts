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
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { RespondScheduleExceptionDto } from './dto/patient/respond-schedule-exception.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('Patient schedule proposals')
@Controller('me/schedule-proposals')
@AuthRole(RoleEnum.PATIENT)
@AuthPermission(PermissionEnum.APPOINTMENT_PROPOSALS_RESPOND_ME)
export class PatientScheduleExceptionsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserDto) {
    return new ApiResponseDto(
      await this.schedulesService.listMyScheduleExceptionProposals(user),
    );
  }

  @Post(':id/respond')
  async respond(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: RespondScheduleExceptionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.schedulesService.respondToScheduleException(id, input, user),
    );
  }
}
