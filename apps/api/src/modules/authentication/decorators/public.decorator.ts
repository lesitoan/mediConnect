import { SetMetadata } from '@nestjs/common';
import { PUBLIC_ROUTE_KEY } from '../constants/authentication.constant';

export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
