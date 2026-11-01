import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { PermissionEnum } from '../authentication/constants/permissions.constant';
import { Auth } from '../authentication/decorators/auth.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { BillingCandidateQueryDto } from './dto/staff/billing-candidate-query.dto';
import { CreateInvoiceDto } from './dto/staff/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { InvoiceQueriesService } from './invoice-queries.service';
import { InvoiceQueryDto } from './dto/staff/invoice-query.dto';

@ApiTags('Staff invoices')
@Controller('staff')
export class StaffInvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly queries: InvoiceQueriesService,
  ) {}

  @Get('invoices')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN],
    permissions: [PermissionEnum.INVOICES_READ],
  })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Tra cứu hóa đơn và số dư thanh toán' })
  async list(@Query() query: InvoiceQueryDto) {
    const { items, pagination } = await this.queries.list(query);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Get('invoices/:id')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN],
    permissions: [PermissionEnum.INVOICES_READ],
  })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Chi tiết hóa đơn và lịch sử giao dịch' })
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.queries.get(id));
  }

  @Get('billing-candidates')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST],
    permissions: [PermissionEnum.BILLING_CANDIDATES_READ],
  })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Danh sách phiên khám đã hoàn tất, chưa lập hóa đơn',
  })
  async listBillingCandidates(@Query() query: BillingCandidateQueryDto) {
    const { items, pagination } =
      await this.invoices.listBillingCandidates(query);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Post('invoices')
  @Auth({
    roles: [RoleEnum.RECEPTIONIST],
    permissions: [PermissionEnum.INVOICES_CREATE],
  })
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Lập hóa đơn từ phiên khám đã hoàn tất và khóa',
  })
  async create(
    @Body() input: CreateInvoiceDto,
    @CurrentUser() actor: CurrentUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.invoices.createFromConsultation(input, actor);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return new HttpResponseBodySuccessDto(result.invoice);
  }
}
