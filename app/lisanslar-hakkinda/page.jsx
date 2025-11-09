'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LicensePage = () => {
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const res = await fetch('/api/pages?slug=lisanslar-hakkinda&type=LICENSE');
        const data = await res.json();
        if (data.ok && data.pages && data.pages.length > 0) {
          setPage(data.pages[0]);
        }
      } catch (error) {
        console.error('Load page error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPage();
  }, []);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='container mx-auto max-w-4xl px-4'>
          <div className='rounded-xl bg-white p-8 text-center shadow-sm'>
            <h1 className='mb-4 text-2xl font-bold text-gray-900'>Lisanslar Hakkında</h1>
            <p className='text-gray-600'>Sayfa içeriği henüz eklenmemiş.</p>
            <Link href='/' className='mt-4 inline-block text-blue-600 hover:text-blue-700'>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='container mx-auto max-w-4xl px-4'>
        <div className='rounded-xl bg-white p-8 shadow-sm'>
          <h1 className='mb-6 text-3xl font-bold text-gray-900'>{page.title}</h1>
          <div
            className='prose max-w-none text-gray-700'
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  );
};

export default LicensePage;

