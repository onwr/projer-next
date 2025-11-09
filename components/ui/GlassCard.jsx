'use client';

import React from 'react';

export const GlassCard = ({ className = '', children }) => {
  return (
    <div
      className={[
        'rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/10 backdrop-blur-md',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export default GlassCard;


