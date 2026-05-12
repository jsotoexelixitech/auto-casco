import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint o controller como público (sin JWT requerido).
 * Anula el JwtAuthGuard global.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
