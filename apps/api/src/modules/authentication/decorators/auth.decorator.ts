import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { PUBLIC_ROUTE_KEY } from '../constants/authentication.constant';

export const Auth = () =>
  applyDecorators(
    SetMetadata(PUBLIC_ROUTE_KEY, false),
    ApiBearerAuth(),
    ApiCookieAuth('accessToken'),
  );
