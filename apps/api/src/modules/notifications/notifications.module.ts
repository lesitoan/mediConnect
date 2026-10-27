import { Module } from '@nestjs/common';
import { OtpDeliveryService } from './services/otp-delivery.service';

@Module({ providers: [OtpDeliveryService], exports: [OtpDeliveryService] })
export class NotificationsModule {}
