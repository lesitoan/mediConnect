import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from './configs/app.config';
import { authenticationConfig } from './configs/authentication.config';
import { databaseConfig } from './configs/database.config';
import { validateEnvironment } from './configs/environment.validation';
import { otpConfig } from './configs/otp.config';
import { redisConfig } from './configs/redis.config';
import { textbeeConfig } from './configs/textbee.config';
import { jwtConfig } from './configs/jwt.config';
import { createLoggerConfig } from './configs/logger.config';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminUsersModule } from './modules/users/admin-users.module';
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
        textbeeConfig,
      ],
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),
    HealthCheckModule,
    AiAssistantModule,
    ProvidersModule,
    SpecialtiesModule,
    SchedulesModule,
    AuthenticationModule,
    AuditLogsModule,
    AppointmentsModule,
    ReviewsModule,
    AdminUsersModule,
  ],
})
export class AppModule {}
