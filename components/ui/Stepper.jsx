'use client';

import React from 'react';

export const Stepper = ({ steps = [], current = 0, accent = 'indigo' }) => {
  const accentBg = `bg-${accent}-600`;
  const accentRing = `ring-${accent}-200`;
  const neutral = 'bg-slate-200';

  return (
    <div className={`grid grid-cols-${Math.max(steps.length, 1)} items-center gap-3`}>
      {steps.map((label, idx) => {
        const isActive = idx <= current;
        return (
          <div key={idx} className='flex items-center gap-2'>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${isActive ? accentBg : neutral}`}
            >
              {idx + 1}
            </div>
            <div className='hidden text-sm font-medium text-slate-700 md:block'>{label}</div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 hidden h-px flex-1 md:block ${isActive ? accentRing : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
