import { Controller, Header, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { SepayPaymentsService } from './sepay-payments.service';

@ApiTags('My payments')
@Controller('me/invoices')
export class PatientPaymentsController {
  constructor(private readonly payments: SepayPaymentsService) {}

  @Post(':id/sepay-qr')
  @Auth({
    roles: [RoleEnum.PATIENT],
    permissions: [PermissionEnum.PAYMENTS_CREATE_ME],
  })
  @Header('Cache-Control', 'no-store')
  async qr(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.payments.qr(id, actor, true),
    );
  }
}
