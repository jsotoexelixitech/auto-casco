import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateInspectionDto,
  UpdateInspectionDto,
} from './dto/create-inspection.dto';
import { InspectionsService } from './inspections.service';

@ApiTags('Inspections')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar inspecciones del usuario' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAllForUser(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una inspección' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Crear inspección (cualquier usuario; perito si captura)' })
  create(@Body() dto: CreateInspectionDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar inspección' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInspectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id, user.role);
  }

  @Post(':id/approve')
  @Roles('perito', 'admin')
  @ApiOperation({ summary: 'Aprobar inspección (solo perito/admin)' })
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.approve(id, user.id, user.role);
  }
}

