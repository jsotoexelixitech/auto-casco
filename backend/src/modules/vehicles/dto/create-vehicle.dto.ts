import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'XYZ-1234' })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  marca!: string;

  @ApiProperty({ example: 'RAV4' })
  @IsString()
  @IsNotEmpty()
  modelo!: string;

  @ApiPropertyOptional({ example: 'XLE Premium' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio!: number;

  @ApiPropertyOptional({ example: 'Blanco' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Particular' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ example: '1HGCM82633A123456' })
  @IsOptional()
  @IsString()
  serial?: string;

  @ApiPropertyOptional({ example: 'https://example.com/car.jpg' })
  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateVehicleDto extends CreateVehicleDto {
  @ApiPropertyOptional() declare placa: string;
  @ApiPropertyOptional() declare marca: string;
  @ApiPropertyOptional() declare modelo: string;
  @ApiPropertyOptional() declare anio: number;
}
