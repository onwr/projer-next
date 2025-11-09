'use client';

import React from 'react';

export const SelectGroup = ({
  categories = {},
  category = '',
  subcategory = '',
  onCategory,
  onSubcategory,
  variant = 'dark',
}) => {
  const categoryList = Object.keys(categories);
  const subList = category ? categories[category] || [] : [];

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='space-y-2'>
        <label
          className={
            variant === 'light' || variant === 'primary'
              ? 'text-sm text-slate-700'
              : 'text-sm text-zinc-300'
          }
        >
          Kategori
        </label>
        <select
          value={category}
          onChange={(e) => onCategory?.(e.target.value)}
          className={
            variant === 'light'
              ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none'
              : variant === 'primary'
                ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
                : 'w-full rounded-xl bg-zinc-900/60 px-4 py-2 text-zinc-100 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none'
          }
        >
          <option value=''>Seçin</option>
          {categoryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className='space-y-2'>
        <label
          className={
            variant === 'light' || variant === 'primary'
              ? 'text-sm text-slate-700'
              : 'text-sm text-zinc-300'
          }
        >
          Alt Kategori
        </label>
        <select
          value={subcategory}
          onChange={(e) => onSubcategory?.(e.target.value)}
          className={
            variant === 'light'
              ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none'
              : variant === 'primary'
                ? 'w-full rounded-xl bg-white px-4 py-2 text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
                : 'w-full rounded-xl bg-zinc-900/60 px-4 py-2 text-zinc-100 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none'
          }
        >
          <option value=''>Seçin</option>
          {subList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectGroup;
