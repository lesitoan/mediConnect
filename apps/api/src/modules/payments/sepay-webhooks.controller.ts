import {
  Controller,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../authentication/decorators/public.decorator';
import { SepayPaymentsService } from './sepay-payments.service';

@ApiTags('SePay webhook')
@Controller('payments/sepay')
export class SepayWebhooksController {
  constructor(private readonly payments: SepayPaymentsService) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  receive(@Req() request: RawBodyRequest<Request>) {
    return this.payments.webhook(
      request.rawBody,
      request.get('X-SePay-Signature'),
      request.get('X-SePay-Timestamp'),
    );
  }
}
