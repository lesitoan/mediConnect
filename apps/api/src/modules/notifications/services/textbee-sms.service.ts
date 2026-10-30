import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendSmsInput {
  deviceId?: string;
  recipients: string[];
  message: string;
}

export interface BulkSmsMessage {
  recipients: string[];
  message: string;
}

export interface SendBulkSmsInput {
  deviceId?: string;
  messages: BulkSmsMessage[];
}

export interface TextbeeSmsResult {
  success: boolean;
  message?: string;
  smsBatchId?: string;
  recipientCount?: number;
  [key: string]: unknown;
}

interface TextbeeApiResponse {
  data?: TextbeeSmsResult;
}

@Injectable()
export class TextbeeSmsService {
  constructor(private readonly config: ConfigService) {}


  // gửi SMS đơn lẻ
  sendSms(input: SendSmsInput): Promise<TextbeeSmsResult> {
    const deviceId = this.getDeviceId(input.deviceId);
    this.validateRecipients(input.recipients);
    if (!input.message.trim()) {
      throw new ServiceUnavailableException('SMS message cannot be empty');
    }

    return this.post('/send-sms', { ...input, deviceId });
  }

  // gửi SMS hàng loạt
  sendBulkSms(input: SendBulkSmsInput): Promise<TextbeeSmsResult> {
    const deviceId = this.getDeviceId(input.deviceId);
    if (!input.messages.length) {
      throw new ServiceUnavailableException(
        'At least one bulk SMS message is required',
      );
    }
    for (const item of input.messages) {
      this.validateRecipients(item.recipients);
      if (!item.message.trim()) {
        throw new ServiceUnavailableException('SMS message cannot be empty');
      }
    }

    return this.post('/send-bulk-sms', { ...input, deviceId });
  }

  private getDeviceId(deviceId?: string): string {
    const configuredDeviceId = this.config.get<string>('textbee.deviceId');
    const resolvedDeviceId = deviceId?.trim() || configuredDeviceId?.trim();
    if (!resolvedDeviceId) {
      throw new ServiceUnavailableException('TextBee deviceId is required');
    }
    return resolvedDeviceId;
  }

  private validateRecipients(recipients: string[]): void {
    if (
      !recipients?.length ||
      recipients.some((recipient) => !recipient.trim())
    ) {
      throw new ServiceUnavailableException(
        'At least one valid SMS recipient is required',
      );
    }
  }

  private async post(
    path: string,
    body: SendSmsInput | SendBulkSmsInput,
  ): Promise<TextbeeSmsResult> {
    const apiKey = this.config.get<string>('textbee.apiKey')?.trim();
    const apiUrl = this.config.get<string>('textbee.apiUrl')?.trim();
    if (!apiKey || !apiUrl) {
      throw new ServiceUnavailableException('TextBee SMS is not configured');
    }

    try {
      const response = await fetch(apiUrl.replace(/\/$/, '') + path, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Delivery rejected');

      const result = (await response.json()) as TextbeeApiResponse;
      if (!result.data?.success) throw new Error('Delivery rejected');
      return result.data;
    } catch {
      // Provider responses can contain credentials, phone numbers or message content.
      throw new ServiceUnavailableException(
        'Unable to send SMS. Try again later',
      );
    }
  }
}
