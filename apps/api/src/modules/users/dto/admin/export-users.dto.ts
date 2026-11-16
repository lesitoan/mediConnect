import { OmitType } from '@nestjs/swagger';
import { UserQueryDto } from './user-query.dto';

export class ExportUsersDto extends OmitType(UserQueryDto, [
  'page',
  'limit',
] as const) {}
