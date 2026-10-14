import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import { CryptoService } from './shared/services/CryptoService';
import { allowedInterfaces } from './shared/settings';

export const authRoutes = ['/sign-in', '/change-password', '/reset-password', '/password-confirmation', '/email-confirmation', '/sign-up'];
export const publicRoutes = ['/'];
export const config = {
  matcher: ['/((?!v1|_next/static|_next/image|.*\\.png$).*)'],
};
export const commonUserRoutes = ['/profile'];

// eslint-disable-next-line consistent-return
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('refresh-token')?.value;
  const pathName = request.nextUrl.pathname;
  if (token) {
    const payload = await decodeJwt(await CryptoService.decryptObject(token));
    const { role } = payload;
    if (!role) {
      request.cookies.delete(['role', 'token', 'refresh-token']);
      return Response.redirect(new URL('/sign-in', request.url));
    }
    const roleName = (role as string).replaceAll('_', '-') as keyof typeof allowedInterfaces;
    if (
      !commonUserRoutes.includes(pathName) &&
      !allowedInterfaces[roleName].some((val) => pathName.startsWith(`/${val}`)) &&
      !publicRoutes.includes(pathName)
    ) {
      return Response.redirect(new URL('/', request.url));
    }
  } else if (
    !publicRoutes.includes(pathName) &&
    !authRoutes.find(route => pathName.startsWith(route))
  ) {
    return Response.redirect(new URL('/sign-in', request.url));
  }
}
