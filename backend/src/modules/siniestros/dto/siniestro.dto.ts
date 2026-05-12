import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSiniestroDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsIn(['leve', 'moderado', 'grave'])
  severidad: string;

  @IsString()
  @IsNotEmpty()
  lugar: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsString()
  hora?: string;

  @IsOptional()
  @IsBoolean()
  heridos?: boolean;

  @IsOptional()
  @IsBoolean()
  autoridad?: boolean;
}
