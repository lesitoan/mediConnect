import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AI_ROOT } from "./configs/paths.js";
import { ChatsModule } from "./modules/chats/chats.module.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(AI_ROOT, ".env"),
    }),
    ChatsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
