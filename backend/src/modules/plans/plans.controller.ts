import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar planes de cobertura disponibles' })
  async findAll() {
    const plans = await this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { precioDia: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features ?? '[]'),
    }));
  }
}
