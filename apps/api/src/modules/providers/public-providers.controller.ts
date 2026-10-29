import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { PublicSearchQueryDto } from '../../common/dto/public-search-query.dto';
import { Public } from '../authentication/decorators/public.decorator';
import { ProvidersService } from './providers.service';

@Public()
@ApiTags('AI public lookups')
@Controller('providers')
export class PublicProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get('ai-search')
  async search(@Query() query: PublicSearchQueryDto) {
    return new HttpResponseBodySuccessDto(await this.providers.search(query));
  }
}
