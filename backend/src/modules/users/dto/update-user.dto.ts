import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '0414-1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'V-12345678' })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional({ example: 'Asegurado Premium' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'JP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  avatar?: string;
}
