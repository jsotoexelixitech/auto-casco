import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class TopupDto {
  @IsNumber()
  @Min(1)
  monto: number;

  @IsOptional()
  @IsString()
  metodo?: string;
}

export class CreateMethodDto {
  @IsIn(['card', 'transfer', 'pago-movil'])
  type: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsString()
  sub?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  isPrimary?: boolean;
}
