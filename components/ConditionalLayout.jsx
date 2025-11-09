'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';

const ConditionalLayout = ({ children }) => {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith('/yonetici');

  if (isAdminPanel) {
    return <>{children}</>;
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>{children}</main>
      <Footer />
      <Cart />
    </div>
  );
};

export default ConditionalLayout;

