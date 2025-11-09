'use client';

import React from 'react';

export const PreviewCard = ({ coverUrl, title, price, tags = [] }) => {
  return (
    <div className='overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm'>
      <div className='aspect-[16/9] w-full bg-slate-100'>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title || 'Kapak'} className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-slate-400'>
            Görsel yok
          </div>
        )}
      </div>
      <div className='space-y-2 p-4'>
        <div className='flex items-center justify-between'>
          <h3 className='line-clamp-1 text-base font-semibold text-slate-900'>
            {title || 'Ürün Başlığı'}
          </h3>
          <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'>
            ₺{Number(price || 0).toFixed(2)}
          </span>
        </div>
        {tags.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {tags.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className='rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200'
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewCard;
