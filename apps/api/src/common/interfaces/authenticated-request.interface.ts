import type { Request } from 'express';
import type { CurrentUserDto } from '../../modules/users/dto/current-user.dto';

export interface AuthenticatedRequest extends Request {
  user?: CurrentUserDto;
  sessionId?: string;
}
