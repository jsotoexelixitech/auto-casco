import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireCorrelativeId, toCorrelativeId } from '../../common/utils/ids';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
} from './dto/create-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: number, role: string) {
    if (role === 'admin' || role === 'perito') {
      return this.prisma.inspection.findMany({
        include: { vehicle: true, perito: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.inspection.findMany({
      where: { vehicle: { ownerId: userId } },
      include: { vehicle: true, perito: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(idOrNumero: string, userId: number, role: string) {
    const correlative = toCorrelativeId(idOrNumero);
    const i = await this.prisma.inspection.findFirst({
      where: {
        OR: [
          ...(correlative != null ? [{ id: correlative }] : []),
          { numero: idOrNumero },
          { legacyId: idOrNumero },
        ],
      },
      include: {
        vehicle: true,
        perito: { select: { id: true, name: true, email: true } },
      },
    });
    if (!i) throw new NotFoundException('Inspección no encontrada');
    if (
      role !== 'admin' &&
      role !== 'perito' &&
      i.vehicle.ownerId !== userId
    ) {
      throw new ForbiddenException();
    }
    return this.parse(i);
  }

  private parse(i: any) {
    return {
      ...i,
      fotos: safeJson(i.fotos, []),
      danios: safeJson(i.danios, []),
    };
  }

  async create(dto: CreateInspectionDto, peritoId: number, role: string) {
    const vehicleId = requireCorrelativeId(dto.vehicleId, 'Vehículo');
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const requested = dto.numero?.trim();
    if (requested) {
      const exists = await this.prisma.inspection.findFirst({
        where: { OR: [{ numero: requested }, { legacyId: requested }] },
      });
      if (exists) {
        throw new ConflictException(`Ya existe la inspección ${requested}`);
      }
    }

    const count = await this.prisma.inspection.count();
    const numero =
      requested || `INS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const created = await this.prisma.inspection.create({
      data: {
        numero,
        legacyId: requested || undefined,
        tipo: dto.tipo ?? 'inicial',
        estado: dto.estado ?? 'borrador',
        vehicleId,
        peritoId: role === 'perito' || role === 'admin' ? peritoId : null,
        ubicacion: dto.ubicacion,
        latitude: dto.latitude,
        longitude: dto.longitude,
        fotos: dto.fotos ?? '[]',
        danios: dto.danios ?? '[]',
        video360Url: dto.video360Url,
        observaciones: dto.observaciones,
      },
      include: { vehicle: true },
    });
    return this.parse(created);
  }

  async update(
    idOrNumero: string,
    dto: UpdateInspectionDto,
    userId: number,
    role: string,
  ) {
    const current = await this.findOne(idOrNumero, userId, role);
    const data: Record<string, unknown> = {};
    if (dto.vehicleId !== undefined) {
      data.vehicleId = requireCorrelativeId(dto.vehicleId, 'Vehículo');
    }
    if (dto.tipo !== undefined) data.tipo = dto.tipo;
    if (dto.estado !== undefined) data.estado = dto.estado;
    if (dto.ubicacion !== undefined) data.ubicacion = dto.ubicacion;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.fotos !== undefined) data.fotos = dto.fotos;
    if (dto.danios !== undefined) data.danios = dto.danios;
    if (dto.video360Url !== undefined) data.video360Url = dto.video360Url;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    const updated = await this.prisma.inspection.update({
      where: { id: current.id },
      data,
      include: { vehicle: true },
    });
    return this.parse(updated);
  }

  async approve(id: string, peritoId: number, role: string) {
    if (role !== 'perito' && role !== 'admin') {
      throw new ForbiddenException('Solo peritos y admins pueden aprobar');
    }
    const current = await this.findOne(id, peritoId, role);
    return this.prisma.inspection.update({
      where: { id: current.id },
      data: {
        estado: 'aprobada',
        peritoId,
        fechaAprobacion: new Date(),
      },
    });
  }
}

function safeJson(raw: string | null | undefined, fallback: unknown) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
