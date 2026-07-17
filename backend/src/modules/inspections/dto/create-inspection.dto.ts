import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

const TIPOS = ['inicial', 'mantenimiento', 'siniestro', 'Auto-Gestionable'] as const;

/** Estados Prisma (libres) + flujo Auto Casco */
const ESTADOS = [
  'borrador',
  'en_revision',
  'aprobada',
  'rechazada',
  'Pendiente de pago',
  'Pendiente de emisión',
  'Emitida',
] as const;

export class CreateInspectionDto {
  @ApiProperty({ example: 'cl0000vehicleid' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional({
    example: 'INS-2026-0001',
    description: 'Número de inspección del wizard. Si no se envía, se genera en servidor.',
  })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ enum: TIPOS, default: 'inicial' })
  @IsOptional()
  @IsIn(TIPOS as unknown as string[])
  tipo?: string;

  @ApiPropertyOptional({ enum: ESTADOS, example: 'Pendiente de pago' })
  @IsOptional()
  @IsIn(ESTADOS as unknown as string[])
  estado?: string;

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

  @ApiPropertyOptional({
    example: '{"plan":"RCV","policyNumber":"18-1-0000079019"}',
    description: 'Texto libre o JSON con metadatos del flujo (pago, emisión, titular)',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {}
