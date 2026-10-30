import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  NotContains,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { UserStatus } from '../../../../generated/prisma/enums';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.LOCKED] })
  @IsIn([UserStatus.ACTIVE, UserStatus.LOCKED])
  status: 'ACTIVE' | 'LOCKED';
  @ApiProperty()
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @NotContains('\u0000')
  reason: string;
}
