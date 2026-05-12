import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ example: 'cl0000vehicleid' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional({ example: 'cl0000planid' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ enum: ['dias', 'saldo'], default: 'dias' })
  @IsIn(['dias', 'saldo'])
  modalidad!: 'dias' | 'saldo';

  @ApiPropertyOptional({ example: 30, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  diasContratados?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  saldoDisponible?: number;
}

export class BuyDaysDto {
  @ApiProperty({ example: 7, minimum: 1 })
  @IsInt()
  @Min(1)
  days!: number;

  @ApiProperty({ example: 62.3, description: 'Total a debitar' })
  @Min(0)
  total!: number;
}
