import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;
}
