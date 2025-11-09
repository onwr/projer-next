'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export const Filters = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('query') ?? '');

  useEffect(() => {
    setQuery(params.get('query') ?? '');
  }, [params]);

  const apply = () => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('query', query);
    else url.searchParams.delete('query');
    url.searchParams.delete('page');
    router.push(url.pathname + '?' + url.searchParams.toString());
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ara..."
        className="h-10 w-full max-w-xs rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-300"
      />
      <button onClick={apply} className="h-10 rounded-md bg-slate-900 px-4 text-sm text-white hover:bg-black">
        Uygula
      </button>
    </div>
  );
};

export default Filters;


