import {
  Controller,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { QueueBoardQueryDto } from './dto/queue-board-query.dto';
import { QueuesService } from './queues.service';
import { CompleteQueueDto } from './dto/complete-queue.dto';

@ApiTags('Queues')
@AuthRole(RoleEnum.RECEPTIONIST, RoleEnum.ADMIN, RoleEnum.DOCTOR)
@Controller('queues')
export class QueuesController {
  constructor(private readonly queues: QueuesService) {}

  @Get('board')
  @ApiOperation({ summary: 'Lấy bảng hàng chờ khám theo bác sĩ' })
  @ApiResponse({ status: 200, description: 'Bảng hàng chờ theo ngày' })
  async board(
    @Query() query: QueueBoardQueryDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(await this.queues.board(query, user));
  }

  @Post(':careSessionId/call')
  @AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOperation({ summary: 'Gọi bệnh nhân đứng đầu hàng chờ của bác sĩ' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Lượt không thể được gọi' })
  async call(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.call(careSessionId, user),
    );
  }

  @Post(':careSessionId/skip')
  @AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOperation({ summary: 'Bỏ qua lượt khám đã được gọi ít nhất ba phút' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiResponse({
    status: 409,
    description: 'Lượt chưa đủ điều kiện hoặc đã thay đổi',
  })
  async skip(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.skip(careSessionId, user),
    );
  }

  @Post(':careSessionId/restore')
  @AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOperation({ summary: 'Đưa lượt bị bỏ qua trở lại hàng chờ thường' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Lượt không thể đưa trở lại' })
  async restore(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.restore(careSessionId, user),
    );
  }

  @Post(':careSessionId/start')
  @AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOperation({ summary: 'Bắt đầu phiên khám đã được gọi' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Lượt không thể bắt đầu' })
  async start(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.start(careSessionId, user),
    );
  }

  @Post(':careSessionId/complete')
  @AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @ApiOperation({ summary: 'Hoàn thành phiên khám đang thực hiện' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Lượt không thể hoàn thành' })
  async complete(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CompleteQueueDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.complete(careSessionId, user, dto.expectedUpdatedAt),
    );
  }

  @Get(':careSessionId/status')
  @ApiOperation({ summary: 'Xem trạng thái lượt khám trong hàng chờ' })
  @ApiParam({ name: 'careSessionId', format: 'uuid' })
  @ApiQuery({ name: 'date', required: false, example: '2026-10-31' })
  async status(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Query() query: QueueBoardQueryDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.queues.status(careSessionId, query.date, user),
    );
  }
}
