import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class StaffEmailPreviewDto extends PickType(CreateUserDto, [
  'fullName',
] as const) {}
