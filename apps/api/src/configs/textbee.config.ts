import { registerAs } from '@nestjs/config';

export const textbeeConfig = registerAs('textbee', () => ({
  apiKey: process.env.TEXTBEE_API_KEY,
  deviceId: process.env.TEXTBEE_DEVICE_ID,
  apiUrl: process.env.TEXTBEE_API_URL,
}));
