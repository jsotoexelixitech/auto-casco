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
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vehículos del usuario (todos si admin/perito)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAllForUser(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por id' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo vehículo' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id, user.role);
  }
}

