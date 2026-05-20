import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

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
