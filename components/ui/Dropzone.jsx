'use client';

import React, { useCallback, useState, useId } from 'react';

export const Dropzone = ({
  onFiles,
  accept = '*',
  multiple = true,
  heightClass = 'h-48',
  label = 'Dosyaları buraya sürükleyin veya tıklayın',
  variant = 'dark',
  inputId,
}) => {
  const [isOver, setIsOver] = useState(false);
  const generatedId = useId();
  const resolvedInputId = inputId || `dz-input-${generatedId}`;

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) onFiles?.(files);
    },
    [onFiles]
  );

  return (
    <div
      role='button'
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById(resolvedInputId)?.click()}
      className={[
        'relative flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition',
        heightClass,
        isOver
          ? variant === 'light'
            ? 'border-indigo-300 bg-indigo-50'
            : variant === 'primary'
              ? 'border-[#2196f3] bg-[#2196f3]/10'
              : 'border-indigo-400/60 bg-indigo-500/10'
          : variant === 'light'
            ? 'border-slate-200 bg-white'
            : variant === 'primary'
              ? 'border-slate-200 bg-white'
              : 'border-white/15 bg-zinc-900/50',
      ].join(' ')}
    >
      <input
        id={resolvedInputId}
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFiles?.(Array.from(e.target.files || []))}
        className='hidden'
      />
      <span
        className={
          variant === 'light' || variant === 'primary'
            ? 'text-sm text-slate-600'
            : 'text-sm text-zinc-300'
        }
      >
        {label}
      </span>
    </div>
  );
};

export default Dropzone;
