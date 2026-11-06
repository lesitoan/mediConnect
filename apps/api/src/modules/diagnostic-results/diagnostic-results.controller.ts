import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../authentication/decorators/auth.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { DiagnosticResultsService } from './diagnostic-results.service';
import { DiagnosticResultsQueryDto } from './dto/diagnostic-results-query.dto';
import { RecordLabResultDto } from '../examinations/dto/record-lab-result.dto';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class DiagnosticOrderMutationDto {
  @ApiProperty() @IsString() @IsNotEmpty() orderRef!: string;
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  expectedUpdatedAt!: string;
}
class DiagnosticImageRemovalDto extends DiagnosticOrderMutationDto {
  @ApiProperty() @IsString() @IsNotEmpty() publicId!: string;
}

@ApiTags('Diagnostic results')
@Auth({ roles: [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN] })
@Controller('diagnostic-results')
export class DiagnosticResultsController {
  constructor(private readonly diagnosticResults: DiagnosticResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List diagnostic orders' })
  async list(@Query() query: DiagnosticResultsQueryDto) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.list(query),
    );
  }

  @Get(':careSessionId/:orderRef')
  async detail(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('orderRef') orderRef: string,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.detail(id, orderRef),
    );
  }

  @Post(':careSessionId/receive')
  async receive(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DiagnosticOrderMutationDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.receive(
        id,
        dto.orderRef,
        dto.expectedUpdatedAt,
        user,
      ),
    );
  }

  @Post(':careSessionId/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderRef', 'expectedUpdatedAt', 'file'],
      properties: {
        orderRef: { type: 'string' },
        expectedUpdatedAt: { type: 'string', format: 'date-time' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2 },
    }),
  )
  async upload(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DiagnosticOrderMutationDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
            overrideMimeType: true,
          }),
        ],
      }),
    )
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.upload(
        id,
        dto.orderRef,
        dto.expectedUpdatedAt,
        file,
        user,
      ),
    );
  }

  @Delete(':careSessionId/images')
  async removeImage(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: DiagnosticImageRemovalDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.removeImage(
        id,
        dto.orderRef,
        dto.publicId,
        dto.expectedUpdatedAt,
        user,
      ),
    );
  }

  @Post(':careSessionId/complete')
  async complete(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RecordLabResultDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.complete(id, dto, user),
    );
  }
}
