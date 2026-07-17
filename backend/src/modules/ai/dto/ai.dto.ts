import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class VehiculoDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ example: '2022' })
  @IsOptional()
  @IsString()
  anio?: string;

  @ApiPropertyOptional({ example: 'AB608IV' })
  @IsOptional()
  @IsString()
  placa?: string;

  @ApiPropertyOptional({ example: 'Plata' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '8Z1TJ51639V319313' })
  @IsOptional()
  @IsString()
  serial?: string;
}

export class AnalyzePhotoDto {
  @ApiProperty({
    description: 'Imagen en base64 (data URL o raw base64)',
    example: 'data:image/jpeg;base64,...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000_000)
  imageData!: string;

  @ApiProperty({ example: ['Capot', 'Parabrisas Del.'] })
  @IsArray()
  @IsString({ each: true })
  piezas!: string[];

  @ApiProperty({ example: 'Frontal con Placa' })
  @IsString()
  @IsNotEmpty()
  secuencia!: string;

  @ApiPropertyOptional({ example: 'Foto de la impronta (serial de carrocería) y serial troquelado.' })
  @IsOptional()
  @IsString()
  secuenciaDescripcion?: string;

  @ApiProperty({ example: 'front' })
  @IsString()
  @IsNotEmpty()
  diagramZone!: string;

  @ApiPropertyOptional({
    description: 'Contexto del vehículo (marca, modelo, año)',
    example: { marca: 'Toyota', modelo: 'RAV4', anio: '2023' },
  })
  @IsOptional()
  @IsObject()
  vehiculo?: Record<string, unknown>;
}

export class ExtractDocumentDto {
  @ApiProperty({ description: 'Imagen del documento en base64' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000_000)
  imageData!: string;

  @ApiProperty({ enum: ['cedula', 'certificado', 'rif'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['cedula', 'certificado', 'rif'])
  docType!: 'cedula' | 'certificado' | 'rif';
}

export class PhotoSequenceRefDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  nombre!: string;

  @ApiProperty()
  @IsString()
  descripcion!: string;
}

export class IdentifySequenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000_000)
  imageData!: string;

  @ApiProperty({ type: [PhotoSequenceRefDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoSequenceRefDto)
  sequences!: PhotoSequenceRefDto[];

  @ApiPropertyOptional({
    description: 'Contexto del vehículo (marca, modelo, año)',
  })
  @IsOptional()
  @IsObject()
  vehiculo?: Record<string, unknown>;
}
