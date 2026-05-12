import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
} from './dto/create-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string, role: string) {
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

  async findOne(id: string, userId: string, role: string) {
    const i = await this.prisma.inspection.findUnique({
      where: { id },
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
    return i;
  }

  async create(dto: CreateInspectionDto, peritoId: string, role: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const count = await this.prisma.inspection.count();
    const numero = `INS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.inspection.create({
      data: {
        numero,
        tipo: dto.tipo ?? 'inicial',
        vehicleId: dto.vehicleId,
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
  }

  async update(
    id: string,
    dto: UpdateInspectionDto,
    userId: string,
    role: string,
  ) {
    await this.findOne(id, userId, role);
    return this.prisma.inspection.update({
      where: { id },
      data: { ...dto },
      include: { vehicle: true },
    });
  }

  async approve(id: string, peritoId: string, role: string) {
    if (role !== 'perito' && role !== 'admin') {
      throw new ForbiddenException('Solo peritos y admins pueden aprobar');
    }
    return this.prisma.inspection.update({
      where: { id },
      data: {
        estado: 'aprobada',
        peritoId,
        fechaAprobacion: new Date(),
      },
    });
  }
}
