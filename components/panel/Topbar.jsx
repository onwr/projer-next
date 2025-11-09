'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Topbar = ({ title = 'Panel' }) => {
  const pathname = usePathname();
  return (
    <header className='sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6'>
        <div>
          <h1 className='text-lg font-semibold text-slate-900'>{title}</h1>
          <p className='text-xs text-slate-500'>{pathname}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href='/'
            className='rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'
          >
            Anasayfa
          </Link>
          <Link
            href='/giris'
            className='rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-black'
          >
            Çıkış
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
