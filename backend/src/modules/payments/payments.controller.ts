import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateCheckoutSsoDto,
  CreateMethodDto,
  TopupDto,
} from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de pagos del usuario' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.svc.findAll(user.id, user.role);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Recargar saldo' })
  topup(@CurrentUser() user: AuthUser, @Body() dto: TopupDto) {
    return this.svc.topup(user.id, dto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'Listar métodos de pago' })
  getMethods(@CurrentUser() user: AuthUser) {
    return this.svc.getMethods(user.id);
  }

  @Post('methods')
  @ApiOperation({ summary: 'Agregar método de pago' })
  addMethod(@CurrentUser() user: AuthUser, @Body() dto: CreateMethodDto) {
    return this.svc.addMethod(user.id, dto);
  }

  @Delete('methods/:id')
  @ApiOperation({ summary: 'Eliminar método de pago' })
  removeMethod(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.removeMethod(id, user.id);
  }

  @Patch('methods/:id/primary')
  @ApiOperation({ summary: 'Marcar método como principal' })
  setPrimary(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.setPrimaryMethod(id, user.id);
  }

  /* ── Checkout Nexus Pagos (fase pruebas: públicos) ──────────────────── */

  @Public()
  @Post('checkout/sso')
  @ApiOperation({ summary: 'Crear SSO de Pagos (Nexus) y devolver redirect_url del iframe' })
  createCheckoutSso(@Body() dto: CreateCheckoutSsoDto) {
    return this.svc.createCheckoutSso(dto);
  }

  @Public()
  @Post('checkout/notify')
  @ApiOperation({ summary: 'Webhook notifyUrl desde pagos-api' })
  checkoutNotify(@Body() body: Record<string, unknown>) {
    return this.svc.handleCheckoutNotify(body || {});
  }

  @Public()
  @Get('checkout/:idOperacion')
  @ApiOperation({ summary: 'Estado de un checkout por idOperacion' })
  checkoutStatus(@Param('idOperacion') idOperacion: string) {
    return this.svc.getCheckoutStatus(idOperacion);
  }
}
