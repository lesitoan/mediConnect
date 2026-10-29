import { Body, Controller, Header, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { Public } from '../authentication/decorators/public.decorator';
import { AiAssistantService } from './ai-assistant.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Public()
@ApiTags('AI assistant')
@Controller('ai-assistant')
export class PublicAiAssistantController {
  constructor(
    private readonly assistant: AiAssistantService,
    private readonly config: ConfigService,
  ) {}

  @Post('chat')
  @Header('Cache-Control', 'no-store')
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookie = cookies?.mediconnect_ai_session;
    const sessionId =
      !dto.reset &&
      typeof cookie === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        cookie,
      )
        ? cookie
        : randomUUID();
    response.cookie('mediconnect_ai_session', sessionId, {
      httpOnly: true,
      secure: this.config.get<string>('AUTH_COOKIE_SECURE') === 'true',
      sameSite:
        this.config.get<'lax' | 'strict' | 'none'>('AUTH_COOKIE_SAME_SITE') ??
        'lax',
      path: '/api/v1/ai-assistant',
      maxAge: 1800000,
    });
    return new HttpResponseBodySuccessDto(
      await this.assistant.chat(
        sessionId,
        request.ip ?? 'unknown',
        dto.message,
        dto.reset,
      ),
    );
  }
}
