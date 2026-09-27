import { SetMetadata } from '@nestjs/common';

// Marca una ruta como accesible sin token. JwtAuthGuard revisa esta
// metadata antes de exigir un Bearer token.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
