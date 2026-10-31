import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { UpdatePatientProfileDto } from '../../../patients/dto/patient/update-patient-profile.dto';

export class UpdateMeDto extends UpdatePatientProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An', maxLength: 100 })
  @AutoTrim()
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  fullName?: string;
}
