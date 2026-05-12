import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

const TIPOS = ['inicial', 'mantenimiento', 'siniestro'] as const;
const ESTADOS = ['borrador', 'en_revision', 'aprobada', 'rechazada'] as const;

export class CreateInspectionDto {
  @ApiProperty({ example: 'cl0000vehicleid' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional({ enum: TIPOS, default: 'inicial' })
  @IsOptional()
  @IsIn(TIPOS as unknown as string[])
  tipo?: (typeof TIPOS)[number];

  @ApiPropertyOptional({ example: 'Av. Principal, Caracas' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ example: 10.4806 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -66.9036 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Array JSON serializado con metadata de fotos' })
  @IsOptional()
  @IsString()
  fotos?: string;

  @ApiPropertyOptional({ description: 'Array JSON serializado de daños identificados' })
  @IsOptional()
  @IsString()
  danios?: string;

  @ApiPropertyOptional({ example: 'https://video.local/demo.mp4' })
  @IsOptional()
  @IsString()
  video360Url?: string;

  @ApiPropertyOptional({ example: 'Vehículo en buen estado general' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateInspectionDto extends CreateInspectionDto {
  @ApiPropertyOptional() declare vehicleId: string;

  @ApiPropertyOptional({ enum: ESTADOS })
  @IsOptional()
  @IsIn(ESTADOS as unknown as string[])
  estado?: (typeof ESTADOS)[number];
}
