import './globals.css';
import { Inter } from 'next/font/google';
import { ReduxProvider } from '@/components/providers/ReduxProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import ConditionalLayout from '@/components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'PROJER.com - 3D Model Marketplace',
  description: 'En kaliteli 3D modelleri keşfedin ve satın alın',
};

export default function RootLayout({ children }) {
  return (
    <html lang='tr' className={inter.className}>
      <body>
        <SessionProvider>
          <ReduxProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
