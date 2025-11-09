import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith('/giris') || path.startsWith('/kayit');

  const requiresAuth =
    path.startsWith('/magaza-paneli') ||
    path.startsWith('/yonetici') ||
    path.startsWith('/kullanici-paneli') ||
    path.startsWith('/urun-ekle') ||
    path.startsWith('/urun-duzenle');

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresAuth && !token) {
    return NextResponse.redirect(new URL('/giris', request.url));
  }

  if (path.startsWith('/magaza-paneli') && token?.userType !== 'STORE') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/yonetici') && token?.userType !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/kullanici-paneli') && token?.userType !== 'USER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/giris',
    '/kayit',
    '/magaza-paneli/:path*',
    '/kullanici-paneli/:path*',
    '/yonetici/:path*',
    '/urun-ekle',
    '/urun-duzenle/:path*',
  ],
};
