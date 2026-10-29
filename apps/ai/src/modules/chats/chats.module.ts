import { Module } from "@nestjs/common";
import { KnowledgeModule } from "../knowledge/knowledge.module.js";
import { LlmModule } from "../llm/llm.module.js";
import { LookupsModule } from "../lookups/lookups.module.js";
import { ChatsController } from "./chats.controller.js";
import { ChatsService } from "./chats.service.js";
import { IntentRouterService } from "./intent-router.service.js";

@Module({
  imports: [KnowledgeModule, LlmModule, LookupsModule],
  controllers: [ChatsController],
  providers: [ChatsService, IntentRouterService],
})
export class ChatsModule {}
