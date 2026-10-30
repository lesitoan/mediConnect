import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../authentication/decorators/auth.decorator';
import { PermissionEnum } from '../../authentication/constants/permissions.constant';
import { RoleEnum } from '../../users/constants/roles.constant';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';
import {
  DoctorAvatarsService,
  MAX_DOCTOR_AVATAR_BYTES,
  type DoctorAvatarFile,
} from '../doctor-avatars.service';

@ApiTags('Admin doctors')
@Controller('admin/doctors/avatar')
export class AdminDoctorAvatarsController {
  constructor(private readonly avatars: DoctorAvatarsService) {}

  @Post()
  @Auth({
    roles: [RoleEnum.ADMIN],
    permissions: [PermissionEnum.DOCTORS_WRITE],
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_DOCTOR_AVATAR_BYTES, files: 1, fields: 0 },
    }),
  )
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_DOCTOR_AVATAR_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
            overrideMimeType: true,
          }),
        ],
      }),
    )
    file: DoctorAvatarFile,
  ) {
    return new HttpResponseBodySuccessDto(await this.avatars.upload(file));
  }
}
