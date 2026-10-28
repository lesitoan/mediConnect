import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { CurrentUserDto } from './dto/responses/current-user.dto';

@ApiTags('Users')
@Controller('me')
export class UsersController {
  @Get()
  @Header('Cache-Control', 'no-store')
  @AuthPermission(PermissionEnum.USERS_READ_ME)
  @ApiOkResponse({
    description:
      'Current user in { success, data }; never includes credentials.',
  })
  getMe(
    @CurrentUser() user: CurrentUserDto,
  ): HttpResponseBodySuccessDto<CurrentUserDto> {
    return new HttpResponseBodySuccessDto(user);
  }
}
