import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OtpDeliveryService, type OtpDelivery } from './otp-delivery.service';

const INPUT: OtpDelivery = {
  challengeId: 'test-challenge',
  destination: 'patient@gmail.com',
  channel: 'EMAIL',
  purpose: 'REGISTER',
  code: '123456',
  expiresInSeconds: 300,
};
const CONFIG = {
  RESEND_API_KEY: 'test-resend-key',
  RESEND_FROM_EMAIL: 'MediConnect <noreply@example.com>',
  ZALO_ACCESS_TOKEN: 'test-zalo-token',
  ZALO_OTP_TEMPLATE_ID: '12345',
  ZALO_OTP_CODE_PARAM: 'otp_code',
};

describe('OTP provider adapters (mock HTTP; never sends real messages)', () => {
  const service = new OtpDeliveryService(new ConfigService(CONFIG));
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses Resend with a unique idempotency key and no OTP in the subject', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }),
    );
    await service.send(INPUT);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options?.headers).toMatchObject({
      'Idempotency-Key': 'otp/test-challenge',
      Authorization: 'Bearer test-resend-key',
    });
    const body = JSON.parse(options!.body as string) as {
      to: string[];
      subject: string;
      text: string;
    };
    expect(body.to).toEqual(['patient@gmail.com']);
    expect(body.subject).not.toContain(INPUT.code);
    expect(body.text).toContain(INPUT.code);
    expect(options?.signal).toBeDefined();
  });

  it('uses Zalo ZBS template API with country prefix and approved OTP parameter', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ error: 0, data: { msg_id: 'message-id' } }),
        { status: 200 },
      ),
    );
    await service.send({
      ...INPUT,
      channel: 'ZALO',
      destination: '+84901234567',
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://business.openapi.zalo.me/message/template');
    expect(options?.headers).toMatchObject({ access_token: 'test-zalo-token' });
    expect(JSON.parse(options!.body as string)).toEqual({
      phone: '84901234567',
      template_id: '12345',
      template_data: { otp_code: '123456' },
      tracking_id: 'test-challenge',
    });
  });

  it.each([
    [500, { message: 'secret provider error' }],
    [200, { error: -201, message: 'secret provider error' }],
    [200, {}],
  ])(
    'rejects failed or malformed Zalo responses without exposing provider content (%s)',
    async (status, payload) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(payload), { status }),
      );
      await expect(
        service.send({
          ...INPUT,
          channel: 'ZALO',
          destination: '+84901234567',
        }),
      ).rejects.toThrow('Unable to send OTP. Try again later');
    },
  );

  it('fails closed for missing configuration and network errors', async () => {
    const missing = new OtpDeliveryService(new ConfigService({}));
    await expect(missing.send(INPUT)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockRejectedValue(new Error('secret token'));
    await expect(service.send(INPUT)).rejects.toThrow(
      'Unable to send OTP. Try again later',
    );
  });
});
