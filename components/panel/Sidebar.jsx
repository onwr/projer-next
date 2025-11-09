'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, LifeBuoy, CreditCard, History } from 'lucide-react';

const NavItem = ({ href, label, icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span aria-hidden className='inline-block h-4 w-4 text-slate-500'>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <aside className='sticky top-0 hidden min-h-screen border-r border-slate-200 bg-white p-4 md:block'>
      <div className='mb-4 px-2 text-xs font-semibold tracking-wider text-slate-500 uppercase'>
        Kullanıcı Paneli
      </div>
      <nav className='space-y-1'>
        <NavItem href='/kullanici-paneli' label='Genel Bakış' icon={<Home size={18} />} />
        <NavItem
          href='/kullanici-paneli/satin-almalar'
          label='Satın Almalarım'
          icon={<ShoppingBag size={18} />}
        />
        <NavItem
          href='/kullanici-paneli/bildirimler/destek'
          label='Destek Bildirimleri'
          icon={<LifeBuoy size={18} />}
        />
        <NavItem
          href='/kullanici-paneli/bildirimler/odeme'
          label='Ödeme Bildirimleri'
          icon={<CreditCard size={18} />}
        />
        <NavItem
          href='/kullanici-paneli/giris-kayit-loglari'
          label='Giriş Kayıtları'
          icon={<History size={18} />}
        />
      </nav>
    </aside>
  );
};

export default Sidebar;
