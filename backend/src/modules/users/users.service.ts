import { Injectable, NotFoundException } from '@nestjs/common';
import { requireCorrelativeId } from '../../common/utils/ids';
import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  title: true,
  avatar: true,
  color: true,
  phone: true,
  documento: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string | number) {
    const userId = requireCorrelativeId(id, 'Usuario');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_SELECT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(
    id: string | number,
    data: Partial<{
      name: string;
      phone: string;
      documento: string;
      title: string;
      avatar: string;
    }>,
  ) {
    const current = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: current.id },
      data,
      select: PUBLIC_SELECT,
    });
  }

  async deactivate(id: string | number) {
    const current = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: current.id },
      data: { active: false },
      select: PUBLIC_SELECT,
    });
  }
}
