import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireCorrelativeId, toCorrelativeId } from '../../common/utils/ids';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSiniestroDto } from './dto/siniestro.dto';

@Injectable()
export class SiniestrosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, role: string) {
    const where =
      role === 'admin' || role === 'perito'
        ? {}
        : { policy: { holderId: userId } };

    const list = await this.prisma.siniestro.findMany({
      where,
      include: {
        vehicle: { select: { marca: true, modelo: true, placa: true, anio: true } },
        policy: { select: { numero: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((s) => this.mapToFrontend(s));
  }

  async findOne(id: string, userId: number, role: string) {
    const correlative = toCorrelativeId(id);
    const s = await this.prisma.siniestro.findFirst({
      where: {
        OR: [
          ...(correlative != null ? [{ id: correlative }] : []),
          { numero: id },
          { legacyId: id },
        ],
      },
      include: {
        vehicle: true,
        policy: { select: { numero: true, holderId: true } },
      },
    });
    if (!s) throw new NotFoundException('Siniestro no encontrado');
    if (
      role !== 'admin' &&
      role !== 'perito' &&
      s.policy.holderId !== userId
    ) {
      throw new ForbiddenException();
    }
    return this.mapToFrontend(s);
  }

  async create(dto: CreateSiniestroDto, userId: number) {
    const vehicleId = requireCorrelativeId(dto.vehicleId, 'Vehículo');
    const policy = await this.prisma.policy.findFirst({
      where: {
        vehicleId,
        holderId: userId,
        estado: 'Activa',
      },
    });

    if (!policy) {
      const anyPolicy = await this.prisma.policy.findFirst({
        where: { holderId: userId },
      });
      if (!anyPolicy) throw new NotFoundException('No tienes pólizas activas');

      return this.createRecord(dto, anyPolicy.id, vehicleId);
    }

    return this.createRecord(dto, policy.id, vehicleId);
  }

  private async createRecord(
    dto: CreateSiniestroDto,
    policyId: number,
    vehicleId: number,
  ) {
    const count = await this.prisma.siniestro.count();
    const numero = `SIN-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const fechaEvento = dto.fecha
      ? new Date(dto.fecha)
      : new Date();

    const s = await this.prisma.siniestro.create({
      data: {
        numero,
        policyId,
        vehicleId,
        tipo: dto.tipo,
        severidad: dto.severidad,
        lugar: dto.lugar,
        descripcion: dto.descripcion,
        hora: dto.hora,
        heridos: dto.heridos ?? false,
        autoridad: dto.autoridad ?? false,
        fechaEvento,
        monto: 0,
        avance: 10,
        estado: 'En Análisis',
      },
      include: {
        vehicle: { select: { marca: true, modelo: true, placa: true, anio: true } },
        policy: { select: { numero: true } },
      },
    });

    return this.mapToFrontend(s);
  }

  private mapToFrontend(s: any) {
    return {
      id: s.numero,
      dbId: s.id,
      fecha: s.fechaEvento.toISOString().slice(0, 10),
      hora: s.hora ?? '',
      estado: s.estado,
      tipo: s.tipo,
      severidad: s.severidad,
      vehicleId: s.vehicleId,
      lugar: s.lugar ?? '',
      descripcion: s.descripcion ?? '',
      heridos: s.heridos,
      autoridad: s.autoridad,
      monto: s.monto,
      avance: s.avance,
      vehicle: s.vehicle ?? null,
      polizaNumero: s.policy?.numero ?? '',
    };
  }
}
