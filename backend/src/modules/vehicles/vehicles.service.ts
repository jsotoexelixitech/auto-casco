import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string, role: string) {
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

  async findOne(id: string, userId: string, role: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    if (role !== 'admin' && role !== 'perito' && v.ownerId !== userId) {
      throw new ForbiddenException();
    }
    return v;
  }

  create(dto: CreateVehicleDto, ownerId: string) {
    return this.prisma.vehicle.create({ data: { ...dto, ownerId } });
  }

  async update(id: string, dto: UpdateVehicleDto, userId: string, role: string) {
    await this.findOne(id, userId, role);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, role: string) {
    await this.findOne(id, userId, role);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
