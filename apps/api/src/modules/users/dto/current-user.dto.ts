import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../generated/prisma/enums';

export class CurrentUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'ID of the assigned role' })
  roleId: string;

  @ApiProperty({
    example: 'PATIENT',
    description: 'Role name used for authorization',
  })
  role: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ type: [String], example: ['USERS_READ_ME'] })
  permissions: string[];

  @ApiProperty()
  createdAt: Date;
}
