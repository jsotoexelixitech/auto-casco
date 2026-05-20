import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PlansService } from './plans.service';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly svc: PlansService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar planes de cobertura disponibles' })
  findAll() {
    return this.svc.findAll();
  }
}
