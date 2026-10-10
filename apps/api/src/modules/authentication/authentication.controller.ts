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
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { OtpService } from './otp.service';
import { ContactDto } from './dto/contact.dto';
import {
  OtpChallengeDto,
  SendOtpDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
  ResetPasswordDto,
} from './dto/otp.dto';
import { AuthenticationService } from './authentication.service';
import { AuthenticationTransportService } from './authentication-transport.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthSessionDto } from './dto/auth-session.dto';
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
  ): Promise<ApiResponseDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<OtpChallengeDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<VerifyOtpResponseDto>> {
    this.transportService.assertAllowedOrigin(request);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<{ message: string }>> {
    this.transportService.assertAllowedOrigin(request);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    this.transportService.assertAllowedOrigin(request);
    const result = await this.authenticationService.login(input, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
    const data = this.transportService.setTokens(response, result);
    response.setHeader('Cache-Control', 'no-store');
    return new ApiResponseDto(data);
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
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const token = this.transportService.readRefreshToken(request, input);
    const result = await this.authenticationService.refresh(token);
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authenticationService.logout(
      request.user!.id,
      request.sessionId,
    );
    this.transportService.clearTokens(response);
    return new ApiResponseDto(result);
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
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authenticationService.logout(request.user!.id);
    this.transportService.clearTokens(response);
    return new ApiResponseDto(result);
  }

  @Auth()
  @Get('sessions')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({
    description: 'Lists only your active sessions. Never exposes token hashes.',
  })
  async sessions(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiResponseDto<AuthSessionDto[]>> {
    return new ApiResponseDto(
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
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.authenticationService.revokeSession(
      request.user!.id,
      sessionId,
    );
    if (sessionId === request.sessionId)
      this.transportService.clearTokens(response);
    return new ApiResponseDto(result);
  }
}
