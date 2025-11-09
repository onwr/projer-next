'use client';

import React from 'react';

const map = {
  YAYINDA: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  TASLAK: 'bg-slate-100 text-slate-700 ring-slate-200',
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  BEKLEMEDE: 'bg-amber-100 text-amber-700 ring-amber-200',
  PENDING: 'bg-amber-100 text-amber-700 ring-amber-200',
  REDDEDILDI: 'bg-rose-100 text-rose-700 ring-rose-200',
  REJECTED: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export const StatusBadge = ({ value = '' }) => {
  const key = String(value || '').toUpperCase();
  const cls = map[key] || 'bg-slate-100 text-slate-700 ring-slate-200';
  const labelMap = {
    YAYINDA: 'Yayında',
    PUBLISHED: 'Yayında',
    TASLAK: 'Taslak',
    DRAFT: 'Taslak',
    BEKLEMEDE: 'Beklemede',
    PENDING: 'Beklemede',
    REDDEDILDI: 'Reddedildi',
    REJECTED: 'Reddedildi',
  };
  const label = labelMap[key] ?? String(value || '');
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>{label}</span>
  );
};

export default StatusBadge;
