import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly svc: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness + readiness probe' })
  check() {
    return this.svc.check();
  }
}
