import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSiniestroDto } from './dto/siniestro.dto';
import { SiniestrosService } from './siniestros.service';

@ApiTags('Siniestros')
@ApiBearerAuth('JWT-auth')
@Controller('siniestros')
export class SiniestrosController {
  constructor(private readonly svc: SiniestrosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar siniestros del usuario' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.svc.findAll(user.id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Reportar un nuevo siniestro' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSiniestroDto) {
    return this.svc.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un siniestro (por número o ID)' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.svc.findOne(id, user.id, user.role);
  }
}
