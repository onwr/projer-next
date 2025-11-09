import { handlers, getLastSuccessfulLogin } from '@/lib/auth.js';
import { NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/logger.js';

// Error handling wrapper
const handleAuthRequest = async (handler, request) => {
  try {
    return await handler(request);
  } catch (error) {
    console.error('NextAuth error:', error);
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu',
      },
      { status: 500 }
    );
  }
};

export const GET = async (request) => {
  try {
    return await handlers.GET(request);
  } catch (error) {
    console.error('NextAuth GET error:', error);
    return NextResponse.json(
      {
        error: 'Authentication error',
        message:
          process.env.NODE_ENV === 'development' ? error.message : 'Oturum bilgisi alınamadı',
      },
      { status: 500 }
    );
  }
};

export const POST = async (request) => {
  try {
    // Request body'yi oku (giriş yapılıyor mu kontrol et)
    const url = new URL(request.url);
    const body = await request.clone().json().catch(() => ({}));
    
    // Giriş işlemi mi kontrol et
    const isSignIn = body?.email || url.pathname.includes('signin') || url.searchParams.get('callbackUrl');
    
    // Response'u al
    const response = await handlers.POST(request);
    
    // Başarılı giriş sonrası log kaydı (non-blocking)
    if (isSignIn && (response.status === 200 || response.status === 302)) {
      try {
        // Authorize fonksiyonundan user ID'yi al
        const { userId, email } = getLastSuccessfulLogin();
        
        if (userId) {
          // Log kaydı yap (non-blocking)
          createActivityLog({
            action: 'LOGIN',
            userId,
            description: 'Kullanıcı giriş yaptı',
            request,
            metadata: {
              email: email || body?.email || 'unknown',
            },
          }).catch(() => {
            // Log kaydı hatası sistemin çalışmasını engellememeli
          });
        }
      } catch (logError) {
        // Log kaydı hatası sistemin çalışmasını engellememeli
        console.error('[Auth] Log kaydı hatası:', logError);
      }
    }
    
    return response;
  } catch (error) {
    console.error('NextAuth POST error:', error);
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Giriş yapılamadı',
      },
      { status: 500 }
    );
  }
};
