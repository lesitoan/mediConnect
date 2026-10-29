import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from './configs/app.config';
import { authenticationConfig } from './configs/authentication.config';
import { databaseConfig } from './configs/database.config';
import { validateEnvironment } from './configs/environment.validation';
import { otpConfig } from './configs/otp.config';
import { redisConfig } from './configs/redis.config';
import { jwtConfig } from './configs/jwt.config';
import { createLoggerConfig } from './configs/logger.config';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

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
    AuditLogsModule,
  ],
})
export class AppModule { }
