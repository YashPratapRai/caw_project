import { Controller, Get } from '@nestjs/common';
import { HealthService } from './observability/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.getHealthStatus();
  }
}
