import {
  Body,
  Controller,
  Header,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { CreateManualPaymentDto } from './dto/staff/create-manual-payment.dto';
import { ManualPaymentsService } from './manual-payments.service';
import { SepayPaymentsService } from './sepay-payments.service';

@ApiTags('Staff payments')
@Controller('staff/invoices')
export class StaffPaymentsController {
  constructor(
    private readonly payments: ManualPaymentsService,
    private readonly sepay: SepayPaymentsService,
  ) {}

  @Post(':id/sepay-qr')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST],
    permissions: [PermissionEnum.PAYMENTS_PREPARE],
  })
  @Header('Cache-Control', 'no-store')
  async qr(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: CurrentUserDto,
  ) {
    return new HttpResponseBodySuccessDto(
      await this.sepay.qr(id, actor, false),
    );
  }

  @Post(':id/manual-payments')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST],
    permissions: [PermissionEnum.PAYMENTS_CONFIRM],
  })
  @Header('Cache-Control', 'no-store')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID v4; giữ nguyên khi retry cùng khoản thu',
  })
  @ApiOperation({ summary: 'Ghi nhận tiền mặt đã thu tại quầy' })
  async create(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CreateManualPaymentDto,
    @Headers('idempotency-key') key: string | undefined,
    @CurrentUser() actor: CurrentUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.payments.create(id, input, key, actor);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return new HttpResponseBodySuccessDto(result.payment);
  }
}
