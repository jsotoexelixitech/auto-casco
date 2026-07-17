import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireCorrelativeId, toCorrelativeId } from '../../common/utils/ids';
import { PrismaService } from '../../prisma/prisma.service';
import { BuyDaysDto, CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: number, role: string) {
    const where = role === 'admin' || role === 'perito' ? {} : { holderId: userId };
    const list = await this.prisma.policy.findMany({
      where,
      include: { vehicle: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => this.parse(p));
  }

  async findOne(idOrNumero: string, userId: number, role: string) {
    const correlative = toCorrelativeId(idOrNumero);
    const p = await this.prisma.policy.findFirst({
      where: {
        OR: [
          ...(correlative != null ? [{ id: correlative }] : []),
          { numero: idOrNumero },
          { legacyId: idOrNumero },
        ],
      },
      include: { vehicle: true, plan: true, pagos: true, siniestros: true },
    });
    if (!p) throw new NotFoundException('Póliza no encontrada');
    if (role !== 'admin' && role !== 'perito' && p.holderId !== userId) {
      throw new ForbiddenException();
    }
    return this.parse(p);
  }

  private parse(p: any) {
    return {
      ...p,
      coberturas: (() => {
        try { return JSON.parse(p.coberturas ?? '[]'); } catch { return []; }
      })(),
      vigenciaDesde: p.fechaInicio?.toISOString?.().slice(0, 10) ?? '',
      vigenciaHasta: p.fechaFin?.toISOString?.().slice(0, 10) ?? '',
      plan: p.planNombre ?? p.plan?.nombre ?? 'Estándar',
      saldo: p.saldoDisponible,
      urlpoliza: p.urlPoliza ?? null,
      cnrecibo: p.cnRecibo ?? null,
    };
  }

  async create(dto: CreatePolicyDto, userId: number) {
    const vehicleId = requireCorrelativeId(dto.vehicleId, 'Vehículo');
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const count = await this.prisma.policy.count();
    const numero =
      (dto.numero && String(dto.numero).trim())
      || `POL-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const fechaFin = dto.diasContratados
      ? new Date(Date.now() + dto.diasContratados * 86_400_000)
      : null;

    const planId = dto.planId != null ? toCorrelativeId(dto.planId) : null;

    return this.prisma.policy.create({
      data: {
        numero,
        legacyId: dto.numero ? String(dto.numero).trim() : undefined,
        modalidad: dto.modalidad,
        planNombre: dto.planNombre ?? 'Estándar',
        diasContratados: dto.diasContratados ?? 0,
        diasRestantes: dto.diasContratados ?? 0,
        saldoDisponible: dto.saldoDisponible ?? 0,
        prima: dto.prima ?? 0,
        coberturas: JSON.stringify(dto.coberturas ?? []),
        urlPoliza: dto.urlPoliza || null,
        cnRecibo: dto.cnRecibo || null,
        vehicleId,
        planId: planId ?? undefined,
        holderId: userId,
        fechaFin,
      },
      include: { vehicle: true, plan: true },
    });
  }

  async buyDays(id: string, dto: BuyDaysDto, userId: number, role: string) {
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
