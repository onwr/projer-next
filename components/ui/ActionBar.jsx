'use client';

import React from 'react';

export const ActionBar = ({ onCancel, onDraft, onPublish, isLoading, variant = 'dark', showDraft = false }) => {
  const wrapClass =
    variant === 'light'
      ? 'rounded-2xl bg-white/95 p-3 ring-1 ring-slate-200 shadow'
      : 'rounded-2xl bg-zinc-900/70 p-3 ring-1 ring-white/10 backdrop-blur-md';
  const cancelClass =
    variant === 'light'
      ? 'rounded-xl px-5 py-2 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50'
      : 'rounded-xl px-5 py-2 text-zinc-300 ring-1 ring-white/15 transition hover:bg-white/5';
  const draftClass =
    variant === 'light'
      ? 'rounded-xl px-5 py-2 text-slate-700 ring-1 ring-indigo-200 transition hover:bg-indigo-50'
      : 'rounded-xl px-5 py-2 text-zinc-200 ring-1 ring-indigo-400/30 transition hover:bg-indigo-500/10';
  const publishClass =
    'rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2 text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60';
  return (
    <div className='sticky bottom-4 z-20 mx-auto max-w-7xl px-4'>
      <div className={wrapClass}>
        <div className='flex items-center justify-end gap-3'>
          <button type='button' onClick={onCancel} className={cancelClass}>
            İptal
          </button>
          {showDraft && (
            <button type='button' onClick={onDraft} className={draftClass}>
              Taslak Kaydet
            </button>
          )}
          <button
            type='submit'
            onClick={onPublish}
            disabled={isLoading}
            className={publishClass}
          >
            {isLoading ? 'Yükleniyor...' : 'Yayınla'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;


