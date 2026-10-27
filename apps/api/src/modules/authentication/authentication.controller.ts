import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { OtpService } from './services/otp.service';
import { ContactDto } from './dto/requests/contact.dto';
import { OtpChallengeDto } from './dto/responses/otp-challenge.dto';
import { SendOtpDto } from './dto/requests/send-otp.dto';
import { VerifyOtpDto } from './dto/requests/verify-otp.dto';
import { VerifyOtpResponseDto } from './dto/responses/verify-otp-response.dto';
import { ResetPasswordDto } from './dto/requests/reset-password.dto';
import { AuthenticationService } from './services/authentication.service';
import { AuthenticationTransportService } from './services/authentication-transport.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/requests/login.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';
import { RegisterDto } from './dto/requests/register.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { AuthSessionDto } from './dto/responses/auth-session.dto';
import { Auth } from './decorators/auth.decorator';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly transportService: AuthenticationTransportService,
    private readonly otpService: OtpService,
  ) {}

  @Public()
  @Post('register')
  @Header('Cache-Control', 'no-store')
  @ApiCreatedResponse({
    description:
      'Creates a pending PATIENT and sends OTP. Returns challenge metadata in { success, data }.',
  })
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
  ): Promise<HttpResponseBodySuccessDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new HttpResponseBodySuccessDto(
      await this.authenticationService.register(input, request.ip ?? 'UNKNOWN'),
    );
  }

  @Public()
  @Post('send_otp')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      'Requests REGISTER or RESET_PASSWORD OTP; generic response for ineligible accounts.',
  })
  async sendOtp(
    @Body() input: SendOtpDto,
    @Req() request: Request,
  ): Promise<HttpResponseBodySuccessDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new HttpResponseBodySuccessDto(
      await this.otpService.send(
        input,
        input.purpose,
        undefined,
        request.ip ?? 'UNKNOWN',
      ),
    );
  }

  @Public()
  @Post('forgot_password')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      'Requests a RESET_PASSWORD OTP; never returns an account record.',
  })
  async forgotPassword(
    @Body() input: ContactDto,
    @Req() request: Request,
  ): Promise<HttpResponseBodySuccessDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new HttpResponseBodySuccessDto(
      await this.otpService.send(
        input,
        'RESET_PASSWORD',
        undefined,
        request.ip ?? 'UNKNOWN',
      ),
    );
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      'Activates a registration or returns a one-use reset token, according to stored purpose.',
  })
  async verify(
    @Body() input: VerifyOtpDto,
    @Req() request: Request,
  ): Promise<HttpResponseBodySuccessDto<VerifyOtpResponseDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new HttpResponseBodySuccessDto(
      await this.otpService.verify(
        input.challengeId,
        input.otp,
        request.ip ?? 'UNKNOWN',
      ),
    );
  }

  @Public()
  @Post('reset_password')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      'After OTP verification: the frontend automatically sends resetToken from /verify with the new password. The user never enters a token. Invalidates previous credentials and sessions.',
  })
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Req() request: Request,
  ): Promise<HttpResponseBodySuccessDto<{ message: string }>> {
    this.transportService.assertAllowedOrigin(request);
    return new HttpResponseBodySuccessDto(
      await this.otpService.resetPassword(
        input.resetToken,
        input.password,
        request.ip ?? 'UNKNOWN',
      ),
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Creates AuthSession. WEB: HttpOnly access/refresh cookies. MOBILE: both tokens in { success, data }.',
  })
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponseBodySuccessDto<LoginResponseDto>> {
    this.transportService.assertAllowedOrigin(request);
    const result = await this.authenticationService.login(input, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
    const data = this.transportService.setTokens(response, result);
    response.setHeader('Cache-Control', 'no-store');
    return new HttpResponseBodySuccessDto(data);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      'Rotates refresh token in the same session. WEB: {} with cookies and an allowed Origin. MOBILE: { refreshToken }. Reuse revokes this session.',
  })
  async refresh(
    @Body() input: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponseBodySuccessDto<LoginResponseDto>> {
    const token = this.transportService.readRefreshToken(request, input);
    const result = await this.authenticationService.refresh(token);
    return new HttpResponseBodySuccessDto(
      this.transportService.setTokens(response, result),
    );
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description: 'Revokes the current session and clears both cookies.',
  })
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponseBodySuccessDto<{ message: string }>> {
    const result = await this.authenticationService.logout(
      request.user!.id,
      request.sessionId,
    );
    this.transportService.clearTokens(response);
    return new HttpResponseBodySuccessDto(result);
  }

  @Auth()
  @Post('logout_all')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description: 'Revokes all sessions belonging to the current user.',
  })
  async logoutAll(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponseBodySuccessDto<{ message: string }>> {
    const result = await this.authenticationService.logout(request.user!.id);
    this.transportService.clearTokens(response);
    return new HttpResponseBodySuccessDto(result);
  }

  @Auth()
  @Get('sessions')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description: 'Lists only your active sessions. Never exposes token hashes.',
  })
  async sessions(
    @Req() request: AuthenticatedRequest,
  ): Promise<HttpResponseBodySuccessDto<AuthSessionDto[]>> {
    return new HttpResponseBodySuccessDto(
      await this.authenticationService.listSessions(
        request.user!.id,
        request.sessionId!,
      ),
    );
  }

  @Auth()
  @Delete('sessions/:sessionId')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description:
      "Revokes one of your sessions. Other users' sessions return 404.",
  })
  async revokeSession(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HttpResponseBodySuccessDto<{ message: string }>> {
    const result = await this.authenticationService.revokeSession(
      request.user!.id,
      sessionId,
    );
    if (sessionId === request.sessionId)
      this.transportService.clearTokens(response);
    return new HttpResponseBodySuccessDto(result);
  }
}
