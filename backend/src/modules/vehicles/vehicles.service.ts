import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requireCorrelativeId } from '../../common/utils/ids';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: number, role: string) {
    if (role === 'admin' || role === 'perito') {
      return this.prisma.vehicle.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.vehicle.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string | number, userId: number, role: string) {
    const vehicleId = requireCorrelativeId(id, 'Vehículo');
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    if (role !== 'admin' && role !== 'perito' && v.ownerId !== userId) {
      throw new ForbiddenException();
    }
    return v;
  }

  create(dto: CreateVehicleDto, ownerId: number) {
    return this.prisma.vehicle.create({ data: { ...dto, ownerId } });
  }

  async update(id: string | number, dto: UpdateVehicleDto, userId: number, role: string) {
    const current = await this.findOne(id, userId, role);
    return this.prisma.vehicle.update({ where: { id: current.id }, data: dto });
  }

  async remove(id: string | number, userId: number, role: string) {
    const current = await this.findOne(id, userId, role);
    return this.prisma.vehicle.delete({ where: { id: current.id } });
  }
}
