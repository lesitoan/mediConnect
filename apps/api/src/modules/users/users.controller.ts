import { Body, Controller, Get, Header, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { AuthPermission } from '../authentication/decorators/auth-permission.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { CurrentUserDto } from './dto/responses/current-user.dto';
import { UpdateMeDto } from './dto/me/update-me.dto';
import { MeUsersService } from './services/me-users.service';

@ApiTags('Users')
@Controller('me')
export class UsersController {
  constructor(private readonly users: MeUsersService) {}

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

  @Patch()
  @Header('Cache-Control', 'no-store')
  @AuthPermission(PermissionEnum.USERS_UPDATE_ME)
  @ApiOkResponse({
    description:
      'Cập nhật các trường được gửi; trả thông tin tài khoản và patientProfile nếu gửi trường bệnh nhân. Email và số điện thoại chỉ đọc.',
  })
  async updateMe(
    @Body() input: UpdateMeDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<HttpResponseBodySuccessDto<CurrentUserDto>> {
    return new HttpResponseBodySuccessDto(
      await this.users.update(input, user.id),
    );
  }
}
