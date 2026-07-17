import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos los usuarios (solo admin)' })
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por id' })
  findOne(@Param('id') id: string, @CurrentUser() current: AuthUser) {
    if (current.role !== 'admin' && current.id !== Number(id)) {
      throw new ForbiddenException('Solo puedes ver tu propio perfil');
    }
    return this.users.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un usuario' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() current: AuthUser,
  ) {
    if (current.role !== 'admin' && current.id !== Number(id)) {
      throw new ForbiddenException('Solo puedes actualizar tu propio perfil');
    }
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar usuario (soft delete, solo admin)' })
  deactivate(@Param('id') id: string) {
    return this.users.deactivate(id);
  }
}

