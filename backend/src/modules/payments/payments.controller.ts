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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateMethodDto, TopupDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de pagos del usuario' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAll(user.sub, user.role);
  }

  @Post('topup')
  @ApiOperation({ summary: 'Recargar saldo' })
  topup(@CurrentUser() user: JwtPayload, @Body() dto: TopupDto) {
    return this.svc.topup(user.sub, dto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'Listar métodos de pago' })
  getMethods(@CurrentUser() user: JwtPayload) {
    return this.svc.getMethods(user.sub);
  }

  @Post('methods')
  @ApiOperation({ summary: 'Agregar método de pago' })
  addMethod(@CurrentUser() user: JwtPayload, @Body() dto: CreateMethodDto) {
    return this.svc.addMethod(user.sub, dto);
  }

  @Delete('methods/:id')
  @ApiOperation({ summary: 'Eliminar método de pago' })
  removeMethod(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.removeMethod(id, user.sub);
  }

  @Patch('methods/:id/primary')
  @ApiOperation({ summary: 'Marcar método como principal' })
  setPrimary(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.setPrimaryMethod(id, user.sub);
  }
}
