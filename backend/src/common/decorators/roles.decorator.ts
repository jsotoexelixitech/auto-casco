import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type Role = 'admin' | 'perito' | 'asegurado' | 'intermediario';

/**
 * @Roles('admin', 'perito') — restringe el endpoint a roles específicos.
 * Requiere RolesGuard activo.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
