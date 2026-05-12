import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMethodDto, TopupDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Historial de pagos ─────────────────────────────────────────────── */
  async findAll(userId: string, role: string) {
    const where =
      role === 'admin' || role === 'perito'
        ? {}
        : {
            OR: [
              { userId },
              { policy: { holderId: userId } },
            ],
          };
    return this.prisma.payment.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 100,
    });
  }

  /* ── Recargar saldo ─────────────────────────────────────────────────── */
  async topup(userId: string, dto: TopupDto) {
    const primary = await this.prisma.paymentMethod.findFirst({
      where: { userId, isPrimary: true, active: true },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        concepto: 'Recarga de saldo',
        metodo: primary?.label ?? dto.metodo ?? 'Saldo',
        monto: Math.abs(dto.monto),
        estado: 'Completado',
      },
    });
    return payment;
  }

  /* ── Métodos de pago ───────────────────────────────────────────────── */
  async getMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId, active: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async addMethod(userId: string, dto: CreateMethodDto) {
    // Si se pide principal, quitar el principal anterior
    if (dto.isPrimary) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Si es el primero, hacerlo principal automáticamente
    const count = await this.prisma.paymentMethod.count({
      where: { userId, active: true },
    });

    return this.prisma.paymentMethod.create({
      data: {
        userId,
        type: dto.type,
        label: dto.label,
        sub: dto.sub,
        icon:
          dto.icon ??
          (dto.type === 'card'
            ? 'credit_card'
            : dto.type === 'transfer'
              ? 'account_balance'
              : 'smartphone'),
        isPrimary: dto.isPrimary ?? count === 0,
      },
    });
  }

  async removeMethod(id: string, userId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.userId !== userId)
      throw new NotFoundException('Método no encontrado');
    if (method.isPrimary)
      throw new BadRequestException(
        'No puedes eliminar el método principal. Marca otro como principal primero.',
      );

    await this.prisma.paymentMethod.update({
      where: { id },
      data: { active: false },
    });
    return { success: true };
  }

  async setPrimaryMethod(id: string, userId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.userId !== userId)
      throw new NotFoundException('Método no encontrado');

    await this.prisma.paymentMethod.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isPrimary: true },
    });
  }
}
