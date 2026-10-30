import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

export const MAX_DOCTOR_AVATAR_BYTES = 2 * 1024 * 1024;
export interface DoctorAvatarFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

function signature(params: Record<string, string>, secret: string): string {
  const content = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1')
    .update(content + secret)
    .digest('hex');
}

@Injectable()
export class DoctorAvatarsService {
  constructor(private readonly config: ConfigService) {}

  async upload(file: DoctorAvatarFile): Promise<{ avatarUrl: string }> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret)
      throw new ServiceUnavailableException(
        'Chưa cấu hình Cloudinary cho API.',
      );
    const params = {
      allowed_formats: 'jpg,png,webp',
      folder: `${this.config.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'mediconnect'}/doctor-avatars`,
      overwrite: 'false',
      public_id: randomUUID(),
      timestamp: String(Math.floor(Date.now() / 1000)),
      transformation: 'c_limit,w_1024,h_1024/f_webp',
    };
    const form = new FormData();
    for (const [key, value] of Object.entries(params)) form.set(key, value);
    form.set('api_key', apiKey);
    form.set('signature', signature(params, apiSecret));
    form.set(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      'avatar',
    );
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
        { method: 'POST', body: form, signal: AbortSignal.timeout(10_000) },
      );
      if (response.status === 400)
        throw new BadRequestException('Cloudinary không chấp nhận ảnh này.');
      if (!response.ok) throw new Error('Cloudinary upload rejected');
      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== 'object' ||
        !('secure_url' in data) ||
        typeof data.secure_url !== 'string' ||
        !('public_id' in data) ||
        typeof data.public_id !== 'string' ||
        !('version' in data) ||
        !Number.isSafeInteger(data.version) ||
        !('signature' in data) ||
        typeof data.signature !== 'string' ||
        !/^[a-f0-9]{40}$/i.test(data.signature)
      )
        throw new Error('Invalid Cloudinary response');
      const expected = signature(
        { public_id: data.public_id, version: String(data.version) },
        apiSecret,
      );
      const url = new URL(data.secure_url);
      if (
        !timingSafeEqual(
          Buffer.from(expected, 'hex'),
          Buffer.from(data.signature, 'hex'),
        ) ||
        url.protocol !== 'https:' ||
        url.hostname !== 'res.cloudinary.com' ||
        !url.pathname.startsWith(`/${cloudName}/image/upload/`) ||
        data.secure_url.length > 500
      )
        throw new Error('Invalid Cloudinary asset');
      // shortcut: unused/replaced avatars stay in Cloudinary; add retention cleanup when storage volume requires it.
      return { avatarUrl: data.secure_url };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new ServiceUnavailableException(
        'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.',
      );
    }
  }
}
