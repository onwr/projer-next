import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request) {
  const session = await auth();
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith('/giris') || path.startsWith('/kayit');

  const requiresAuth =
    path.startsWith('/magaza-paneli') ||
    path.startsWith('/yonetici') ||
    path.startsWith('/kullanici-paneli') ||
    path.startsWith('/urun-ekle') ||
    path.startsWith('/urun-duzenle');

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL('/giris', request.url));
  }

  if (path.startsWith('/magaza-paneli') && session?.user?.userType !== 'STORE') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/yonetici') && session?.user?.userType !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Kütüphanem sayfası tüm kullanıcı tiplerine açık
  if (path.startsWith('/kullanici-paneli/satin-almalar')) {
    // Tüm kullanıcı tipleri erişebilir (USER, STORE, ADMIN)
    return NextResponse.next();
  }

  if (path.startsWith('/kullanici-paneli') && session?.user?.userType !== 'USER') {
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
