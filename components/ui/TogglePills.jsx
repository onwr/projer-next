'use client';

import React from 'react';

export const TogglePills = ({ options = [], values = [], onChange, accent = 'indigo' }) => {
  const activeCls = `bg-${accent}-600 text-white`;
  const passiveCls = 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  const toggle = (val) => {
    if (!onChange) return;
    const set = new Set(values);
    if (set.has(val)) set.delete(val); else set.add(val);
    onChange(Array.from(set));
  };

  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((opt) => (
        <button
          type='button'
          key={opt}
          onClick={() => toggle(opt)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${values.includes(opt) ? activeCls : passiveCls}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default TogglePills;


