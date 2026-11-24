import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { RecordLabResultDto } from '../examinations/dto/record-lab-result.dto';
import { DiagnosticOrderActionDto } from './dto/diagnostic-order-action.dto';
import { SaveDiagnosticResultDraftDto } from './dto/save-diagnostic-result-draft.dto';
import {
  MAX_DIAGNOSTIC_IMAGE_BYTES,
  MAX_DIAGNOSTIC_IMAGES,
  type DiagnosticResultUpload,
} from './diagnostic-result-files.service';
import { DiagnosticResultsService } from './diagnostic-results.service';

@ApiTags('Diagnostic results')
@AuthRole(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
@Controller('diagnostic-results')
export class DiagnosticResultsController {
  constructor(private readonly diagnosticResults: DiagnosticResultsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Query('date') date: string | undefined,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.list(date, user),
    );
  }

  @Post(':careSessionId/orders/receive')
  async receive(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Body() dto: DiagnosticOrderActionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.receive(
        careSessionId,
        dto.orderRef,
        dto.expectedUpdatedAt,
        user,
      ),
    );
  }

  @Patch(':careSessionId/orders/draft')
  async saveDraft(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Body() dto: SaveDiagnosticResultDraftDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.saveDraft(careSessionId, dto, user),
    );
  }

  @Post(':careSessionId/orders/files')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['orderRef', 'expectedUpdatedAt', 'files'],
      properties: {
        orderRef: { type: 'string', maxLength: 150 },
        expectedUpdatedAt: { type: 'string', format: 'date-time' },
        files: {
          type: 'array',
          maxItems: MAX_DIAGNOSTIC_IMAGES,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', MAX_DIAGNOSTIC_IMAGES, {
      limits: {
        fileSize: MAX_DIAGNOSTIC_IMAGE_BYTES,
        files: MAX_DIAGNOSTIC_IMAGES,
        fields: 2,
      },
    }),
  )
  async uploadFiles(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Body() dto: DiagnosticOrderActionDto,
    @UploadedFiles() files: DiagnosticResultUpload[] | undefined,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.uploadFiles(
        careSessionId,
        dto,
        files ?? [],
        user,
      ),
    );
  }

  @Delete(':careSessionId/orders/files/:fileId')
  async removeFile(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string,
    @Body() dto: DiagnosticOrderActionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.removeFile(
        careSessionId,
        fileId,
        dto,
        user,
      ),
    );
  }

  @Get(':careSessionId/orders/files/:fileId')
  @Header('Cache-Control', 'private, no-store')
  async readFile(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string,
    @Query('orderRef') orderRef: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    const file = await this.diagnosticResults.readFile(
      careSessionId,
      orderRef,
      fileId,
      user,
    );
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: 'inline',
    });
  }

  @Post(':careSessionId/orders/complete')
  async complete(
    @Param('careSessionId', new ParseUUIDPipe({ version: '4' }))
    careSessionId: string,
    @Body() dto: RecordLabResultDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.diagnosticResults.complete(careSessionId, dto, user),
    );
  }
}
