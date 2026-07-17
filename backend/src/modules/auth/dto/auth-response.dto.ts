import { ApiProperty } from '@nestjs/swagger';

export class UserPublicDto {
  @ApiProperty({ example: 1, description: 'ID correlativo (autoincrement)' })
  id!: number;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['admin', 'perito', 'asegurado', 'intermediario'] })
  role!: string;
  @ApiProperty({ required: false }) title?: string | null;
  @ApiProperty({ required: false }) avatar?: string | null;
  @ApiProperty({ required: false }) color?: string | null;
  @ApiProperty({ required: false }) phone?: string | null;
  @ApiProperty({ required: false }) documento?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Bearer token. Inclúyelo en el header Authorization.',
  })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 86400, description: 'Tiempo de expiración en segundos' })
  expiresIn!: number;

  @ApiProperty({ type: UserPublicDto })
  user!: UserPublicDto;
}
