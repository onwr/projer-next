import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import { createActivityLog } from './logger.js';

// NEXTAUTH_SECRET kontrolü
if (!process.env.NEXTAUTH_SECRET) {
  console.warn(
    '⚠️  NEXTAUTH_SECRET bulunamadı! Lütfen .env dosyasına NEXTAUTH_SECRET ekleyin. Development modunda geçici bir secret kullanılıyor.'
  );
}

// Global değişken: son başarılı giriş için user ID (thread-safe değil ama Next.js'te tek request olduğu için sorun yok)
let lastSuccessfulLoginUserId = null;
let lastSuccessfulLoginEmail = null;

export const getLastSuccessfulLogin = () => {
  const userId = lastSuccessfulLoginUserId;
  const email = lastSuccessfulLoginEmail;
  lastSuccessfulLoginUserId = null;
  lastSuccessfulLoginEmail = null;
  return { userId, email };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/giris',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production',
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Prisma bağlantısını kontrol et
          try {
            // Prisma client'ın yüklendiğinden emin ol
            await prisma.$connect();
          } catch (dbError) {
            // Prisma client generate edilmemişse bilgilendir
            if (dbError.message.includes('did not initialize')) {
              console.error(
                '⚠️  Prisma Client henüz generate edilmemiş!\n' +
                  'Lütfen şu komutu çalıştırın: npx prisma generate'
              );
              // Development modunda session endpoint'i çalışsın diye null döndür
              if (process.env.NODE_ENV === 'production') {
                throw new Error('Database bağlantısı başarısız');
              }
              return null;
            }

            console.error('Database connection error:', dbError.message);
            // Development modunda database olmadan da çalışabilmek için
            if (process.env.NODE_ENV === 'production') {
              throw new Error('Database bağlantısı başarısız');
            }
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Başarılı giriş için user ID'yi sakla (log kaydı için)
          lastSuccessfulLoginUserId = user.id;
          lastSuccessfulLoginEmail = user.email;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            userType: user.userType,
            storeName: user.storeName,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.storeName = user.storeName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.storeName = token.storeName;
      }
      return session;
    },
  },
});
