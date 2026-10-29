import { IsUUID } from 'class-validator';

export class ConfirmReassignmentDto {
  @IsUUID()
  toSlotId: string;
}
