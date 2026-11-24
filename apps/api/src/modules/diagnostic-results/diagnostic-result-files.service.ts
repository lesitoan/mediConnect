import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const MAX_DIAGNOSTIC_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DIAGNOSTIC_IMAGES = 6;

export interface DiagnosticResultUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface DiagnosticResultFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class DiagnosticResultFilesService {
  private readonly storageDirectory = resolve(
    process.env.DIAGNOSTIC_RESULTS_STORAGE_DIR ||
      join(process.cwd(), 'uploads', 'diagnostic-results'),
  );

  async store(file: DiagnosticResultUpload): Promise<DiagnosticResultFile> {
    const extension = MIME_EXTENSIONS[file.mimetype];
    if (
      !extension ||
      !file.buffer.length ||
      file.size !== file.buffer.length ||
      file.size > MAX_DIAGNOSTIC_IMAGE_BYTES ||
      !this.hasValidSignature(file.buffer, file.mimetype)
    )
      throw new BadRequestException(
        'Chọn ảnh JPG, PNG hoặc WebP hợp lệ, mỗi ảnh tối đa 5 MB.',
      );

    await mkdir(this.storageDirectory, { recursive: true });
    const id = randomUUID();
    await writeFile(this.filePath(id, file.mimetype), file.buffer, {
      flag: 'wx',
      mode: 0o600,
    });
    return {
      id,
      name:
        file.originalname
          .replace(/[\\/]/g, '_')
          .replace(/[\u0000-\u001f\u007f]/g, '')
          .trim()
          .slice(0, 255) || `ket-qua.${extension}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  async read(id: string, mimeType: string): Promise<Buffer> {
    try {
      return await readFile(this.filePath(id, mimeType));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      )
        throw new NotFoundException('Không tìm thấy tệp kết quả.');
      throw error;
    }
  }

  async remove(id: string, mimeType: string): Promise<void> {
    try {
      await unlink(this.filePath(id, mimeType));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      )
        throw new NotFoundException('Không tìm thấy tệp kết quả cần xóa.');
      throw error;
    }
  }

  async restore(
    id: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<void> {
    await writeFile(this.filePath(id, mimeType), buffer, {
      flag: 'wx',
      mode: 0o600,
    });
  }

  private filePath(id: string, mimeType: string): string {
    const extension = MIME_EXTENSIONS[mimeType];
    if (
      !extension ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new BadRequestException('Tệp kết quả không hợp lệ.');
    return join(this.storageDirectory, `${id}.${extension}`);
  }

  private hasValidSignature(buffer: Buffer, mimeType: string): boolean {
    if (mimeType === 'image/jpeg')
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    if (mimeType === 'image/png')
      return buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    return (
      mimeType === 'image/webp' &&
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }
}
