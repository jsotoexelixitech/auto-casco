import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class CheckoutLineDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsNumber()
  amountVes: number;

  @ApiProperty()
  @IsNumber()
  amountUsd: number;
}

export class CreateCheckoutSsoDto {
  @ApiProperty({ example: 'OP-INS-2026-001' })
  @IsString()
  @IsNotEmpty()
  idOperacion: string;

  @ApiProperty({ example: 'Pago póliza RCV' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Monto en Bs (cuota según frecuencia)' })
  @IsNumber()
  totalVes: number;

  @ApiProperty({ description: 'Monto en USD (cuota según frecuencia)' })
  @IsNumber()
  totalUsd: number;

  @ApiProperty({ description: 'Tasa de cambio Valrep (ptasa)' })
  @IsNumber()
  exchangeRate: number;

  @ApiProperty({ type: [CheckoutLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  lines: CheckoutLineDto[];

  @ApiProperty({ example: 'V' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  documentNumber: string;

  @ApiProperty()
  @IsString()
  payerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerPhone?: string;

  @ApiProperty({
    description: 'URL de redirect del browser tras el pago (front)',
    example: 'http://localhost:5173/pago/resultado?idOperacion=OP-123',
  })
  @IsString()
  @IsNotEmpty()
  redirectUrl: string;

  @ApiPropertyOptional({ description: 'Override de cproductor' })
  @IsOptional()
  @IsString()
  cproductor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  extraPayload?: Record<string, unknown>;
}
