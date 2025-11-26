'use client';

import React from 'react';

export const Wizard = ({ steps = [], current = 1, onPrev, onNext, children, variant = 'dark', hideButtons = false }) => {
  const isLight = variant === 'light';
  const isCompact = variant === 'compactBlue';
  const barClass = isCompact
    ? 'flex items-center justify-between overflow-x-auto whitespace-nowrap rounded-2xl bg-white p-3 ring-1 ring-slate-200'
    : isLight
      ? 'flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200'
      : 'flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-900/60 p-3 ring-1 ring-white/10';
  const paneClass = isCompact
    ? 'rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow'
    : isLight
      ? 'rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow'
      : 'rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/10';
  return (
    <div className='space-y-6'>
      <ol className={`${barClass} sticky top-20 z-10 bg-white`}>
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === current;
          const isDone = stepNumber < current;
          return (
            <li
              key={label}
              className={
                isCompact
                  ? 'flex flex-col items-center px-2 py-1'
                  : 'flex items-center gap-2 rounded-xl px-3 py-2 text-sm'
              }
            >
              <span
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm',
                  isCompact
                    ? isDone
                      ? 'border-[#2196f3] bg-[#2196f3] text-white'
                      : isActive
                        ? 'border-[#2196f3] text-[#2196f3]'
                        : 'border-slate-300 text-slate-500'
                    : isDone
                      ? 'border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                      : isActive
                        ? isLight
                          ? 'border-indigo-300 text-indigo-600'
                          : 'border-indigo-400/40 text-indigo-300'
                        : isLight
                          ? 'border-slate-200 text-slate-500'
                          : 'border-white/15 text-zinc-400',
                ].join(' ')}
              >
                {stepNumber}
              </span>
              <span
                className={
                  isCompact
                    ? isActive
                      ? 'mt-1 text-xs font-semibold text-slate-900'
                      : 'mt-1 text-xs text-slate-500'
                    : isActive
                      ? isLight
                        ? 'text-slate-900'
                        : 'text-zinc-100'
                      : isLight
                        ? 'text-slate-500'
                        : 'text-zinc-400'
                }
              >
                {label}
              </span>
              {!isCompact && idx !== steps.length - 1 && (
                <span
                  className={
                    isLight
                      ? 'mx-2 hidden h-px w-8 bg-slate-200 md:block'
                      : 'mx-2 hidden h-px w-8 bg-white/10 md:block'
                  }
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className={paneClass}>{children}</div>

      {!hideButtons && (
        <div className='flex items-center justify-between'>
          <button
            type='button'
            onClick={onPrev}
            className={
              isCompact
                ? 'rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50'
                : isLight
                  ? 'rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50'
                  : 'rounded-xl px-4 py-2 text-zinc-300 ring-1 ring-white/15 transition hover:bg-white/5'
            }
          >
            Geri
          </button>
          <button
            type='button'
            onClick={onNext}
            className={
              isCompact
                ? 'rounded-xl bg-[#2196f3] px-5 py-2 text-white shadow-md transition hover:brightness-110'
                : 'rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-white shadow-md transition hover:brightness-110'
            }
          >
            İleri
          </button>
        </div>
      )}
    </div>
  );
};

export default Wizard;
