import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { CurrentUserDto } from './dto/current-user.dto';

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
  getMe(@CurrentUser() user: CurrentUserDto): ApiResponseDto<CurrentUserDto> {
    return new ApiResponseDto(user);
  }
}
