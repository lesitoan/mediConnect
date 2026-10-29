import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto } from '../../common/dto/http-response-body-success.dto';
import { Public } from '../authentication/decorators/public.decorator';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { SchedulesService } from './schedules.service';

@Public()
@ApiTags('AI public lookups')
@Controller('schedules')
export class PublicSchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get('ai-availability')
  @Header('Cache-Control', 'no-store')
  async availability(@Query() query: AvailabilityQueryDto) {
    return new HttpResponseBodySuccessDto(
      await this.schedules.availability(query),
    );
  }
}
