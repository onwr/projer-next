import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

const SearchPage = () => (
  <Suspense
    fallback={
      <div className='flex min-h-screen items-center justify-center bg-gray-50 text-gray-600'>
        Yükleniyor...
      </div>
    }
  >
    <SearchContent />
  </Suspense>
);

export default SearchPage;

