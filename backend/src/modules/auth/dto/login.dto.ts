import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'carolina.rivas@gmail.com',
    description: 'Email del usuario registrado',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Demo1234!',
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
