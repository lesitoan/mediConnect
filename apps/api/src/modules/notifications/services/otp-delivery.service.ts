import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OtpDelivery {
  challengeId: string;
  destination: string;
  channel: 'EMAIL' | 'ZALO';
  purpose: 'REGISTER' | 'RESET_PASSWORD';
  code: string;
  expiresInSeconds: number;
}

@Injectable()
export class OtpDeliveryService {
  constructor(private readonly config: ConfigService) {}

  assertConfigured(channel: 'EMAIL' | 'ZALO'): void {
    const keys =
      channel === 'EMAIL'
        ? ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']
        : ['ZALO_ACCESS_TOKEN', 'ZALO_OTP_TEMPLATE_ID', 'ZALO_OTP_CODE_PARAM'];
    if (keys.some((key) => !this.config.get<string>(key)?.trim())) {
      throw new ServiceUnavailableException(
        channel + ' OTP delivery is not configured',
      );
    }
  }

  async send(input: OtpDelivery): Promise<void> {
    this.assertConfigured(input.channel);
    try {
      const isEmail = input.channel === 'EMAIL';
      const action =
        input.purpose === 'REGISTER'
          ? 'kích hoạt tài khoản'
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
      throw new ServiceUnavailableException(
        'Unable to send OTP. Try again later',
      );
    }
  }
}
