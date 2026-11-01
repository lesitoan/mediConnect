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

  @Post(':careSessionId/open')
  @ApiOperation({ summary: 'Mở phiên khám đã được gọi' })
  async open(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.examinations.open(careSessionId, user),
    );
  }

  @Patch(':careSessionId')
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
}
