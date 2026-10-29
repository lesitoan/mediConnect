import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class BookAppointmentDto {
  @IsUUID()
  appointmentSlotId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
