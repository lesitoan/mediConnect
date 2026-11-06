import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RoleEnum } from '../users/constants/roles.constant';
import { PermissionEnum } from './constants/permissions.constant';
import { Auth } from './decorators/auth.decorator';
import { RequestContactChangeDto } from './dto/requests/request-contact-change.dto';
import { VerifyOtpDto } from './dto/requests/verify-otp.dto';
import { AuthenticationTransportService } from './services/authentication-transport.service';
import { OtpService } from './services/otp.service';

@ApiTags('Authentication')
@Controller('me/contact-change')
@Auth({
  roles: [RoleEnum.PATIENT],
  permissions: [PermissionEnum.USERS_UPDATE_ME],
})
export class PatientContactChangeController {
  constructor(
    private readonly otp: OtpService,
    private readonly transport: AuthenticationTransportService,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async requestChange(
    @Body() input: RequestContactChangeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.transport.assertAllowedOrigin(request, !request.get('authorization'));
    return new HttpResponseBodySuccessDto(
      await this.otp.requestContactChange(
        input,
        request.user!.id,
        request.sessionId!,
        request.ip ?? 'UNKNOWN',
      ),
    );
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async confirmChange(
    @Body() input: VerifyOtpDto,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.transport.assertAllowedOrigin(request, !request.get('authorization'));
    const result = await this.otp.confirmContactChange(
      input.challengeId,
      input.otp,
      request.user!.id,
      request.sessionId!,
    );
    this.transport.clearTokens(response);
    return new HttpResponseBodySuccessDto(result);
  }
}
