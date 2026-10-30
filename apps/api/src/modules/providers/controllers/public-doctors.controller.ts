import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../authentication/decorators/public.decorator';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';
import { DoctorQueryDto } from '../dto/doctor-query.dto';
import { ProvidersService } from '../providers.service';

@ApiTags('Public doctors')
@Controller('providers')
export class PublicDoctorsController {
  constructor(private readonly providers: ProvidersService) {}

  @Public()
  @Get()
  async list(@Query() query: DoctorQueryDto) {
    const { items, pagination } = await this.providers.list(query, false);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Public()
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(await this.providers.get(id, false));
  }
}
