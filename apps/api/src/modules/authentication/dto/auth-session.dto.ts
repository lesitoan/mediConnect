import { ApiProperty } from '@nestjs/swagger';
import { AuthSessionClientType } from '../../../generated/prisma/enums';

export class AuthSessionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: AuthSessionClientType })
  clientType: AuthSessionClientType;
  @ApiProperty({ nullable: true }) deviceName: string | null;
  @ApiProperty({ nullable: true }) userAgent: string | null;
  @ApiProperty({ nullable: true }) ipAddress: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() lastActiveAt: Date;
  @ApiProperty() expiresAt: Date;
  @ApiProperty() isCurrent: boolean;
}
