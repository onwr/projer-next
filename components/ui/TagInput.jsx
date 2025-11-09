'use client';

import React, { useState } from 'react';

export const TagInput = ({
  values = [],
  onChange,
  max = 10,
  placeholder = 'Etiket ekle...',
  variant = 'dark',
}) => {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (values.includes(v)) return;
    if (values.length >= max) return;
    onChange?.([...values, v]);
    setInput('');
  };

  const remove = (i) => onChange?.(values.filter((_, idx) => idx !== i));

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {values.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className={
              variant === 'light'
                ? 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200'
                : variant === 'primary'
                  ? 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200'
                  : 'inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-200 ring-1 ring-white/10'
            }
          >
            <span>{t}</span>
            <button
              type='button'
              onClick={() => remove(i)}
              className={
                variant === 'light'
                  ? 'text-slate-500 hover:text-slate-700'
                  : variant === 'primary'
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-zinc-400 hover:text-zinc-200'
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className='flex gap-2'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={
            variant === 'light'
              ? 'flex-1 rounded-xl bg-white px-4 py-2 text-slate-900 placeholder-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-200 focus:outline-none'
              : variant === 'primary'
                ? 'flex-1 rounded-xl bg-white px-4 py-2 text-slate-900 placeholder-slate-400 ring-1 ring-slate-200 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
                : 'flex-1 rounded-xl bg-zinc-900/60 px-4 py-2 text-zinc-100 placeholder-zinc-500 ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400/40 focus:outline-none'
          }
        />
        <button
          type='button'
          onClick={add}
          className={
            variant === 'primary'
              ? 'rounded-xl bg-[#2196f3] px-4 py-2 text-white shadow-md transition hover:brightness-110'
              : 'rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-white shadow-md transition hover:brightness-110'
          }
        >
          Ekle
        </button>
      </div>
      <p
        className={
          variant === 'light' || variant === 'primary'
            ? 'text-xs text-slate-500'
            : 'text-xs text-zinc-500'
        }
      >
        Maksimum {max} etiket
      </p>
    </div>
  );
};

export default TagInput;
