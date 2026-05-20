import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { BuyDaysDto, CreatePolicyDto } from './dto/create-policy.dto';
import { PoliciesService } from './policies.service';

@ApiTags('Policies')
@ApiBearerAuth('JWT-auth')
@Controller('policies')
export class PoliciesController {
  constructor(private readonly service: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pólizas del usuario (todas si admin/perito)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAllForUser(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una póliza' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Emitir una nueva póliza' })
  create(@Body() dto: CreatePolicyDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Post(':id/buy-days')
  @ApiOperation({ summary: 'Comprar días adicionales sobre una póliza activa' })
  buyDays(
    @Param('id') id: string,
    @Body() dto: BuyDaysDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.buyDays(id, dto, user.id, user.role);
  }
}

