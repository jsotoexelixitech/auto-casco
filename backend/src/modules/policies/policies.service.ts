import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BuyDaysDto, CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string, role: string) {
    const where = role === 'admin' || role === 'perito' ? {} : { holderId: userId };
    return this.prisma.policy.findMany({
      where,
      include: { vehicle: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const p = await this.prisma.policy.findUnique({
      where: { id },
      include: { vehicle: true, plan: true, pagos: true, siniestros: true },
    });
    if (!p) throw new NotFoundException('Póliza no encontrada');
    if (role !== 'admin' && role !== 'perito' && p.holderId !== userId) {
      throw new ForbiddenException();
    }
    return p;
  }

  async create(dto: CreatePolicyDto, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const count = await this.prisma.policy.count();
    const numero = `POL-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.policy.create({
      data: {
        numero,
        modalidad: dto.modalidad,
        diasContratados: dto.diasContratados ?? 0,
        diasRestantes: dto.diasContratados ?? 0,
        saldoDisponible: dto.saldoDisponible ?? 0,
        vehicleId: dto.vehicleId,
        planId: dto.planId,
        holderId: userId,
      },
      include: { vehicle: true, plan: true },
    });
  }

  async buyDays(id: string, dto: BuyDaysDto, userId: string, role: string) {
    const policy = await this.findOne(id, userId, role);
    return this.prisma.policy.update({
      where: { id: policy.id },
      data: {
        diasContratados: policy.diasContratados + dto.days,
        diasRestantes: policy.diasRestantes + dto.days,
        pagos: {
          create: {
            concepto: `Compra de ${dto.days} días — ${policy.numero}`,
            metodo: 'Saldo',
            monto: -Math.abs(dto.total),
            estado: 'Completado',
          },
        },
      },
      include: { vehicle: true, plan: true, pagos: true },
    });
  }
}
