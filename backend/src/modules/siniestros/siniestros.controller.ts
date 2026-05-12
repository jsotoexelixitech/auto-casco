import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateSiniestroDto } from './dto/siniestro.dto';
import { SiniestrosService } from './siniestros.service';

@ApiTags('Siniestros')
@ApiBearerAuth()
@Controller('siniestros')
export class SiniestrosController {
  constructor(private readonly svc: SiniestrosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar siniestros del usuario' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.svc.findAll(user.sub, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Reportar un nuevo siniestro' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSiniestroDto) {
    return this.svc.create(dto, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un siniestro (por número o ID)' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.findOne(id, user.sub, user.role);
  }
}
