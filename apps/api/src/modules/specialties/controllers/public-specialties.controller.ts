import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../../common/dto/http-response-body-success.dto';
import { Public } from '../../authentication/decorators/public.decorator';
import { SpecialtyQueryDto } from '../dto/specialty-query.dto';
import { SpecialtiesService } from '../specialties.service';

@ApiTags('Public specialties')
@Controller('specialties')
export class PublicSpecialtiesController {
  constructor(private readonly specialties: SpecialtiesService) {}

  @Public()
  @Get()
  async list(@Query() query: SpecialtyQueryDto) {
    const { items, pagination } = await this.specialties.list(query, false);
    return new HttpResponseBodySuccessDto(items, pagination);
  }

  @Public()
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return new HttpResponseBodySuccessDto(
      await this.specialties.get(id, false),
    );
  }
}
