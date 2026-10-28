import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../authentication/decorators/public.decorator';
import { HealthCheckService } from './services/health-check.service';

@ApiTags('Health')
@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Public()
  @Get()
  check() {
    return this.healthCheckService.check();
  }
}
