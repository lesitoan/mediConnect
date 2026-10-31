import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { normalizePhone } from '../../../../common/utils/normalize-phone';
import { RoleEnum } from '../../constants/roles.constant';
import { CreateDoctorDto } from '../../../providers/dto/admin/create-doctor.dto';

export class UserDoctorProfileDto extends OmitType(CreateDoctorDto, [
  'fullName',
  'phone',
] as const) {}

export class CreateUserDto {
  @ApiProperty()
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  fullName: string;
  @ApiProperty({
    enum: [RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR],
  })
  @IsIn([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR])
  role: RoleEnum.ADMIN | RoleEnum.RECEPTIONIST | RoleEnum.DOCTOR;
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+84[35789]\d{8}$/)
  phone: string;
  @ApiPropertyOptional({ type: UserDoctorProfileDto })
  @ValidateIf(
    (input: CreateUserDto) =>
      input.role === RoleEnum.DOCTOR || input.doctor !== undefined,
  )
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserDoctorProfileDto)
  doctor?: UserDoctorProfileDto;
}
