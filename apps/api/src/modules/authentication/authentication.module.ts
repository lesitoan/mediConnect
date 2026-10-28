import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OtpService } from './services/otp.service';
import { RedisModule } from '../redis/redis.module';
import { OtpStoreService } from './services/otp-store.service';
import { UsersModule } from '../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './services/authentication.service';
import { AuthenticationTransportService } from './services/authentication-transport.service';
import { AuthGuard } from './guards/auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    DatabaseModule,
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.getOrThrow<number>('jwt.expiresInSeconds'),
          issuer: config.getOrThrow<string>('jwt.issuer'),
          audience: config.getOrThrow<string>('jwt.audience'),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: config.getOrThrow<string>('jwt.issuer'),
          audience: config.getOrThrow<string>('jwt.audience'),
        },
      }),
    }),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    OtpService,
    OtpStoreService,
    AuthenticationTransportService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthenticationModule {}
