import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMethodDto, TopupDto, CreateCheckoutSsoDto } from './dto/payments.dto';

export type CheckoutSession = {
  idOperacion: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'ok' | 'error';
  paymentVerified: boolean;
  redirectUrl?: string;
  notify?: Record<string, unknown>;
  sso?: Record<string, unknown>;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  /** Sesiones de checkout en memoria (fase de pruebas). */
  private readonly checkouts = new Map<string, CheckoutSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /* ── Historial de pagos ─────────────────────────────────────────────── */
  async findAll(userId: number, role: string) {
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
  async topup(userId: number, dto: TopupDto) {
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
  async getMethods(userId: number) {
    return this.prisma.paymentMethod.findMany({
      where: { userId, active: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async addMethod(userId: number, dto: CreateMethodDto) {
    if (dto.isPrimary) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

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

  async removeMethod(id: string, userId: number) {
    const methodId = Number(id);
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: methodId },
    });
    if (!method || method.userId !== userId)
      throw new NotFoundException('Método no encontrado');
    if (method.isPrimary)
      throw new BadRequestException(
        'No puedes eliminar el método principal. Marca otro como principal primero.',
      );

    await this.prisma.paymentMethod.update({
      where: { id: methodId },
      data: { active: false },
    });
    return { success: true };
  }

  async setPrimaryMethod(id: string, userId: number) {
    const methodId = Number(id);
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: methodId },
    });
    if (!method || method.userId !== userId)
      throw new NotFoundException('Método no encontrado');

    await this.prisma.paymentMethod.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
    return this.prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isPrimary: true },
    });
  }

  /* ── Nexus checkout SSO ─────────────────────────────────────────────── */
  async createCheckoutSso(dto: CreateCheckoutSsoDto) {
    const apiUrl = this.config.get<string>('nexus.apiUrl') || '';
    const apiKey = this.config.get<string>('nexus.apiKey') || '';
    const canal = this.config.get<string>('nexus.canal') || '27';
    const notifyUrl = this.config.get<string>('nexus.notifyUrl') || '';

    if (!apiUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'Nexus no configurado (NEXUS_API_URL / NEXUS_API_KEY)',
      );
    }

    const now = new Date().toISOString();
    this.checkouts.set(dto.idOperacion, {
      idOperacion: dto.idOperacion,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
      paymentVerified: false,
      redirectUrl: dto.redirectUrl,
    });

    const body = {
      target: 'pagos',
      cproductor: dto.cproductor || '80080',
      canal,
      metadata: {
        cproductor: dto.cproductor || '80080',
        canal,
        checkout: {
          referenceId: dto.idOperacion,
          title: dto.title,
          subtitle: dto.subtitle || 'La Mundial de Seguros',
          totalVes: dto.totalVes,
          totalUsd: dto.totalUsd,
          exchangeRate: dto.exchangeRate,
          lines: dto.lines,
        },
        rules: {
          requirePayment: true,
          methods: ['mobile'],
          onSuccess: {
            mode: 'redirect',
            redirectUrl: dto.redirectUrl,
            /** Intentar salir del iframe hacia la ventana principal */
            target: '_top',
            webhookUrl: notifyUrl || undefined,
          },
        },
        payer: {
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          name: dto.payerName,
          phone: dto.payerPhone || undefined,
        },
        payload: {
          ...(dto.extraPayload || {}),
          notifyUrl: notifyUrl || undefined,
          idOperacion: dto.idOperacion,
        },
      },
    };

    const url = `${apiUrl}/api/auth/sso-delegate`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`SSO Nexus unreachable: ${String(err)}`);
      throw new ServiceUnavailableException('No se pudo conectar con Nexus SSO');
    }

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        (typeof json.message === 'string' && json.message) ||
        (typeof json.error === 'string' && json.error) ||
        `Nexus SSO HTTP ${res.status}`;
      throw new BadRequestException(msg);
    }

    const redirectUrl =
      (typeof json.redirect_url === 'string' && json.redirect_url) ||
      (typeof json.redirectUrl === 'string' && json.redirectUrl) ||
      '';

    if (!redirectUrl) {
      throw new BadRequestException('Nexus no devolvió redirect_url');
    }

    const session = this.checkouts.get(dto.idOperacion);
    if (session) {
      session.sso = json;
      session.updatedAt = new Date().toISOString();
      this.checkouts.set(dto.idOperacion, session);
    }

    return {
      idOperacion: dto.idOperacion,
      redirect_url: redirectUrl,
      empresa: json.empresa ?? null,
      modulo: json.modulo ?? null,
      notifyConfigured: Boolean(notifyUrl),
    };
  }

  /** Callback server-to-server desde pagos-api. */
  async handleCheckoutNotify(payload: Record<string, unknown>) {
    const idOperacion = String(
      payload.idOperacion ||
        payload.referenceId ||
        (payload.payload as Record<string, unknown> | undefined)?.idOperacion ||
        (payload.checkout as Record<string, unknown> | undefined)?.referenceId ||
        '',
    ).trim();

    if (!idOperacion) {
      throw new BadRequestException('idOperacion requerido en notify');
    }

    const verified =
      payload.paymentVerified === true ||
      payload.status === 'ok' ||
      String(payload.code || '').toUpperCase() === 'ACCP';

    const prev = this.checkouts.get(idOperacion);
    const now = new Date().toISOString();
    const session: CheckoutSession = {
      idOperacion,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
      status: verified ? 'ok' : 'error',
      paymentVerified: verified,
      redirectUrl: prev?.redirectUrl,
      sso: prev?.sso,
      notify: payload,
    };
    this.checkouts.set(idOperacion, session);
    this.logger.log(
      `Checkout notify ${idOperacion}: verified=${verified} code=${String(payload.code || '')}`,
    );
    return { success: true, idOperacion, paymentVerified: verified };
  }

  getCheckoutStatus(idOperacion: string) {
    const session = this.checkouts.get(idOperacion);
    if (!session) {
      return {
        idOperacion,
        status: 'unknown',
        paymentVerified: false,
        found: false,
      };
    }
    return {
      ...session,
      found: true,
    };
  }
}
