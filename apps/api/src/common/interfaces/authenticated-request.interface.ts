import type { Request } from 'express';
import type { CurrentUserDto } from '../../modules/users/dto/responses/current-user.dto';

export interface AuthenticatedRequest extends Request {
  user?: CurrentUserDto;
  sessionId?: string;
}
