import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  if ((config.get<string>("AI_INTERNAL_TOKEN")?.length ?? 0) < 32)
    throw new Error("AI_INTERNAL_TOKEN must contain at least 32 characters");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(
    Number(config.get<string>("PORT") ?? 4100),
    config.get<string>("HOST") ?? "127.0.0.1",
  );
}

void bootstrap();
