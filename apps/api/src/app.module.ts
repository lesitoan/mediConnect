import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from './config/app.config';
import { authenticationConfig } from './config/authentication.config';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { otpConfig } from './config/otp.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { createLoggerConfig } from './config/logger.config';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        authenticationConfig,
        otpConfig,
        redisConfig,
      ],
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),
    HealthCheckModule,
    AuthenticationModule,
  ],
})
export class AppModule {}
