import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "node:crypto";
import { ChatsService } from "./chats.service.js";
import { ChatRequestDto } from "./dto/chat-request.dto.js";

@Controller("internal/chats")
export class ChatsController {
  constructor(
    @Inject(ChatsService) private readonly chats: ChatsService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Post()
  chat(
    @Headers("x-ai-internal-token") token: string | undefined,
    @Body() dto: ChatRequestDto,
  ) {
    const expected = this.config.get<string>("AI_INTERNAL_TOKEN") ?? "";
    if (
      !token ||
      !expected ||
      Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    )
      throw new UnauthorizedException();
    return this.chats.chat(dto);
  }
}
