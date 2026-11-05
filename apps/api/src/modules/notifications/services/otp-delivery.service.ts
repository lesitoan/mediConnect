import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextbeeSmsService } from './textbee-sms.service';

const UNABLE_TO_SEND_OTP = 'Unable to send OTP. Try again later';

export interface OtpDelivery {
  challengeId: string;
  destination: string;
  channel: 'EMAIL' | 'PHONE';
  purpose: 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_CONTACT';
  code: string;
  expiresInSeconds: number;
}

@Injectable()
export class OtpDeliveryService {
  constructor(
    private readonly config: ConfigService,
    private readonly sms: TextbeeSmsService,
  ) {}

  private isZaloConfigured(): boolean {
    return [
      'ZALO_ACCESS_TOKEN',
      'ZALO_OTP_TEMPLATE_ID',
      'ZALO_OTP_CODE_PARAM',
    ].every((key) => this.config.get<string>(key)?.trim());
  }

  assertConfigured(channel: OtpDelivery['channel']): void {
    const isConfigured =
      channel === 'EMAIL'
        ? ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'].every((key) =>
            this.config.get<string>(key)?.trim(),
          )
        : this.sms.isConfigured() || this.isZaloConfigured();
    if (!isConfigured) {
      throw new ServiceUnavailableException(
        channel + ' OTP delivery is not configured',
      );
    }
  }

  async send(input: OtpDelivery): Promise<void> {
    this.assertConfigured(input.channel);
    if (input.channel === 'PHONE' && this.sms.isConfigured()) {
      try {
        // Reuse the code if a timed-out SMS was already accepted by the provider.
        await this.sms.sendSms({
          recipients: [input.destination],
          message: `MediConnect: Ma OTP cua ban la ${input.code}. Hieu luc ${Math.ceil(input.expiresInSeconds / 60)} phut. Khong chia se ma nay.`,
        });
        // shortcut: TextBee acceptance can precede delivery, add receipt handling if fallback must cover later failures.
        return;
      } catch (error) {
        if (!(error instanceof ServiceUnavailableException)) throw error;
        if (!this.isZaloConfigured())
          throw new ServiceUnavailableException(UNABLE_TO_SEND_OTP);
      }
    }
    try {
      const isEmail = input.channel === 'EMAIL';
      const action =
        input.purpose === 'REGISTER'
          ? 'kích hoạt tài khoản'
          : input.purpose === 'CHANGE_CONTACT'
            ? 'đổi liên hệ đăng nhập'
            : 'đặt lại mật khẩu';
      const response = await fetch(
        isEmail
          ? 'https://api.resend.com/emails'
          : 'https://business.openapi.zalo.me/message/template',
        {
          method: 'POST',
          signal: AbortSignal.timeout(10_000),
          headers: isEmail
            ? {
                'Content-Type': 'application/json',
                Authorization:
                  'Bearer ' + this.config.getOrThrow<string>('RESEND_API_KEY'),
                'Idempotency-Key': 'otp/' + input.challengeId,
              }
            : {
                'Content-Type': 'application/json',
                access_token:
                  this.config.getOrThrow<string>('ZALO_ACCESS_TOKEN'),
              },
          body: JSON.stringify(
            isEmail
              ? {
                  from: this.config.getOrThrow<string>('RESEND_FROM_EMAIL'),
                  to: [input.destination],
                  subject: 'MediConnect - Mã xác thực',
                  text: `Mã ${action} MediConnect của bạn là ${input.code}. Mã có hiệu lực ${Math.ceil(input.expiresInSeconds / 60)} phút. Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua tin nhắn.`,
                }
              : {
                  phone: input.destination.replace(/^\+/, ''),
                  template_id: this.config.getOrThrow<string>(
                    'ZALO_OTP_TEMPLATE_ID',
                  ),
                  template_data: {
                    [this.config.getOrThrow<string>('ZALO_OTP_CODE_PARAM')]:
                      input.code,
                  },
                  tracking_id: input.challengeId,
                },
          ),
        },
      );
      if (!response.ok) throw new Error('Delivery rejected');
      const result = (await response.json()) as {
        id?: unknown;
        error?: unknown;
      };
      if (isEmail ? typeof result.id !== 'string' : result.error !== 0)
        throw new Error('Delivery rejected');
    } catch {
      // Provider errors may include tokens, contacts or message content; never log them.
      throw new ServiceUnavailableException(UNABLE_TO_SEND_OTP);
    }
  }
}
