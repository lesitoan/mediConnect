import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpDeliveryService } from './services/otp-delivery.service';
import { TextbeeSmsService } from './services/textbee-sms.service';

@Module({
  providers: [
    OtpDeliveryService,
    {
      provide: TextbeeSmsService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new TextbeeSmsService(config),
    },
  ],
  exports: [OtpDeliveryService, TextbeeSmsService],
})
export class NotificationsModule {}
