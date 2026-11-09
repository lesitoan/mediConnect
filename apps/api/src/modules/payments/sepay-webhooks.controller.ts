import {
  Controller,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../authentication/decorators/public.decorator';
import { SepayPaymentsService } from './sepay-payments.service';

@ApiTags('SePay webhook')
@Controller('payments/sepay')
export class SepayWebhooksController {
  constructor(private readonly payments: SepayPaymentsService) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-MediConnect-Webhook-Version', 'sepay-bidv-va-v2')
  receive(
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader(
      'X-MediConnect-Webhook-Received-At',
      new Date().toISOString(),
    );
    return this.payments.webhook(
      request.rawBody,
      request.get('X-SePay-Signature'),
      request.get('X-SePay-Timestamp'),
    );
  }
}
