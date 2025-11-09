'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  FolderTree,
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
      return;
    }
    if (status === 'authenticated' && session?.user?.userType !== 'ADMIN') {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.userType !== 'ADMIN') {
    return null;
  }

  const menuItems = [
    { href: '/yonetici', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/yonetici/kullanicilar', icon: Users, label: 'Kullanıcılar' },
    { href: '/yonetici/magazalar', icon: Store, label: 'Mağazalar' },
    { href: '/yonetici/kategoriler', icon: FolderTree, label: 'Kategoriler' },
    { href: '/yonetici/urunler', icon: Package, label: 'Ürünler' },
    { href: '/yonetici/siparisler', icon: ShoppingBag, label: 'Siparişler' },
    { href: '/yonetici/bakiyeler', icon: DollarSign, label: 'Bakiyeler' },
    { href: '/yonetici/cekim-talepleri', icon: CreditCard, label: 'Çekim Talepleri' },
    { href: '/yonetici/destek-talepleri', icon: MessageSquare, label: 'Destek Talepleri' },
    { href: '/yonetici/sayfalar', icon: FileText, label: 'Sayfalar' },
    { href: '/yonetici/raporlar', icon: BarChart3, label: 'Raporlar' },
    { href: '/yonetici/ayarlar', icon: Settings, label: 'Ayarlar' },
    { href: '/yonetici/loglar', icon: FileText, label: 'Loglar' },
  ];

  const isActive = (href) => {
    if (href === '/yonetici') {
      return pathname === '/yonetici';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex h-full flex-col'>
          {/* Logo & Header */}
          <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
            <Link href='/yonetici' className='flex items-center space-x-2'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white'>
                <LayoutDashboard size={24} />
              </div>
              <span className='text-xl font-bold text-gray-900'>Admin Panel</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className='lg:hidden'
            >
              <X size={24} className='text-gray-500' />
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 space-y-1 overflow-y-auto px-4 py-4'>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className='border-t border-gray-200 p-4'>
            <div className='mb-3 rounded-lg bg-gray-50 p-3'>
              <p className='text-sm font-semibold text-gray-900'>
                {session.user.name}
              </p>
              <p className='text-xs text-gray-500'>{session.user.email}</p>
            </div>
            <Link
              href='/api/auth/signout'
              className='flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50'
            >
              <LogOut size={20} />
              <span>Çıkış Yap</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className='lg:pl-64'>
        {/* Top Bar */}
        <header className='sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-4 lg:px-8'>
          <div className='flex items-center justify-between'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='lg:hidden'
            >
              <Menu size={24} className='text-gray-500' />
            </button>
            <div className='flex-1' />
            <div className='flex items-center space-x-4'>
              <Link
                href='/'
                target='_blank'
                className='text-sm text-gray-600 hover:text-gray-900'
              >
                Siteye Git
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-4 lg:p-8'>{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

