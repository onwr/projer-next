'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export const ProductsToolbar = ({
  query = '',
  onQuery,
  selectedCount = 0,
  pageSize = 10,
  onPageSize,
}) => {
  const [q, setQ] = useState(query);

  return (
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <div className='flex items-center gap-2'>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onQuery?.(e.target.value);
          }}
          placeholder='Ürün ara...'
          className='w-64 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
        />
      </div>
      <div className='flex items-center gap-2'>
        {selectedCount > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-sm text-slate-600'>{selectedCount} seçili</span>
            <button className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50'>Yayınla</button>
            <button className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50'>Geri Çek</button>
            <button className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50'>Sil</button>
          </div>
        )}
        <Link
          href='/magaza-paneli/urun-ekle'
          className='rounded-xl bg-[#2196f3] px-4 py-2 text-white shadow-md transition hover:brightness-110'
        >
          Yeni Ürün
        </Link>
      </div>
    </div>
  );
};

export default ProductsToolbar;


