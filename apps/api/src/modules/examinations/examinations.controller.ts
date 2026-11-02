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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { ExaminationsService } from './examinations.service';
import { RecordLabResultDto } from './dto/record-lab-result.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import {
  ConfirmMedicalRecordDto,
  ExaminationVersionDto,
  IncompleteExaminationDto,
  PauseExaminationDto,
} from './dto/examination-transition.dto';

@ApiTags('Examinations')
@AuthRole(RoleEnum.DOCTOR, RoleEnum.ADMIN)
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinations: ExaminationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phiên khám của bác sĩ' })
  async list(
    @Query('date') date: string | undefined,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.list(date, user),
    );
  }

  @Get(':careSessionId')
  async get(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.get(careSessionId, user),
    );
  }

  @Get(':careSessionId/history')
  @ApiOperation({
    summary:
      'Xem các phiên khám trước của cùng bệnh nhân trong phạm vi được phép',
  })
  async history(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.history(careSessionId, user),
    );
  }

  @Post(':careSessionId/open')
  @ApiOperation({ summary: 'Mở phiên khám đã được gọi' })
  async open(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Body() dto: ExaminationVersionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.open(careSessionId, dto.expectedUpdatedAt, user),
    );
  }

  @Post(':careSessionId/pause')
  @ApiOperation({ summary: 'Tạm dừng khẩn cấp phiên khám' })
  async pause(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: PauseExaminationDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.pause(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/resume')
  @ApiOperation({ summary: 'Tiếp tục phiên khám đã tạm dừng' })
  async resume(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ExaminationVersionDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.resume(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/incomplete')
  @ApiOperation({
    summary: 'Đánh dấu phiên khám chưa hoàn chỉnh và khóa nội dung',
  })
  async incomplete(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: IncompleteExaminationDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.markIncomplete(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/medical-records/:recordId/confirm')
  @ApiOperation({ summary: 'Xác nhận tiền sử hoặc dị ứng trong phiên khám' })
  async confirmMedicalRecord(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Param('recordId', new ParseUUIDPipe({ version: '4' })) recordId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: ConfirmMedicalRecordDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.confirmMedicalRecord(
        careSessionId,
        recordId,
        dto,
        user,
      ),
    );
  }

  @Patch(':careSessionId')
  @ApiOperation({ summary: 'Cập nhật nội dung phiên khám và chẩn đoán' })
  async update(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: UpdateExaminationDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.update(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/lab-results')
  @ApiOperation({ summary: 'Ghi kết quả cận lâm sàng' })
  async recordLabResult(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: RecordLabResultDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.recordLabResult(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/referrals')
  @ApiOperation({ summary: 'Tạo yêu cầu chuyển chuyên khoa chưa có khung giờ' })
  async createReferral(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateReferralDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.createReferral(careSessionId, dto, user),
    );
  }
}
