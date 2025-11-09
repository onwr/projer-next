'use client';

import React from 'react';

export const PriceSection = ({
  isFree,
  price,
  onToggleFree,
  onPrice,
  license,
  onLicense,
  variant = 'dark',
}) => {
  return (
    <div className='space-y-4'>
      <div
        className={
          variant === 'light' || variant === 'primary'
            ? 'flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200'
            : 'flex items-center justify-between rounded-xl bg-zinc-900/60 p-3 ring-1 ring-white/10'
        }
      >
        <span
          className={
            variant === 'light' || variant === 'primary'
              ? 'text-sm text-slate-700'
              : 'text-sm text-zinc-300'
          }
        >
          Ürün Ücretsiz
        </span>
        <button
          type='button'
          onClick={() => onToggleFree?.(!isFree)}
          className={[
            'relative inline-flex h-7 w-12 items-center rounded-full transition',
            isFree ? 'bg-emerald-500/80' : 'bg-gray-300/50',
          ].join(' ')}
          aria-pressed={isFree}
        >
          <span
            className={[
              'inline-block h-5 w-5 transform rounded-full bg-white transition',
              isFree ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <label
            className={
              variant === 'light' || variant === 'primary'
                ? 'text-sm text-slate-700'
                : 'text-sm text-zinc-300'
            }
          >
            Fiyat
          </label>
          <div className='flex'>
            {variant === 'light' || variant === 'primary' ? (
              <span className='flex items-center rounded-l-xl bg-slate-100 px-3 text-slate-700 ring-1 ring-slate-200'>
                ₺
              </span>
            ) : (
              <span className='flex items-center rounded-l-xl bg-zinc-800 px-3 text-zinc-200 ring-1 ring-white/10'>
                ₺
              </span>
            )}
            <input
              type='number'
              value={isFree ? '' : price}
              onChange={(e) => onPrice?.(e.target.value)}
              disabled={isFree}
              placeholder='0'
              className={
                variant === 'light'
                  ? 'ring-l-0 w-full rounded-r-xl bg-white px-4 py-2 text-slate-900 placeholder-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50'
                  : variant === 'primary'
                    ? 'ring-l-0 w-full rounded-r-xl bg-white px-4 py-2 text-slate-900 placeholder-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2196f3] focus:outline-none disabled:opacity-50'
                    : 'w-full rounded-r-xl bg-zinc-900/60 px-4 py-2 text-zinc-100 placeholder-zinc-600 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none disabled:opacity-50'
              }
            />
          </div>
        </div>
        <div className='space-y-2'>
          <label
            className={
              variant === 'light' || variant === 'primary'
                ? 'text-sm text-slate-700'
                : 'text-sm text-zinc-300'
            }
          >
            Lisans
          </label>
          <select
            value={license}
            onChange={(e) => onLicense?.(e.target.value)}
            className={
              variant === 'light'
                ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none'
                : variant === 'primary'
                  ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
                  : 'w-full rounded-xl bg-zinc-900/60 px-4 py-2 text-zinc-100 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none'
            }
          >
            <option>Telifsiz, yapay zeka yok</option>
            <option>Telifsiz, yapay zekaya izinli</option>
            <option>Ticari kullanım</option>
            <option>Yalnızca kişisel kullanım</option>
          </select>
        </div>
      </div>

      {variant === 'light' || variant === 'primary' ? (
        <div className='rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200'>
          Ücretli ürünlerde iade koşullarını ve lisans kapsamını net belirtin. Ücretsiz ürünlerde
          dahi kullanım şartlarını eklemeniz önerilir.
        </div>
      ) : (
        <div className='rounded-xl bg-white/5 p-3 text-sm text-zinc-400 ring-1 ring-white/10'>
          Ücretli ürünlerde iade koşullarını ve lisans kapsamını net belirtin. Ücretsiz ürünlerde
          dahi kullanım şartlarını eklemeniz önerilir.
        </div>
      )}
    </div>
  );
};

export default PriceSection;
