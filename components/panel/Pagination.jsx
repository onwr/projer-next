'use client';

export const Pagination = ({ page = 1, pageCount = 1, onPageChange = () => {} }) => {
  const isFirst = page <= 1;
  const isLast = page >= pageCount;
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        className={`rounded-md border px-3 py-1.5 text-sm ${isFirst ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
      >
        Önceki
      </button>
      <span className="text-sm text-gray-600">
        Sayfa {page} / {pageCount}
      </span>
      <button
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        className={`rounded-md border px-3 py-1.5 text-sm ${isLast ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}
      >
        Sonraki
      </button>
    </div>
  );
};

export default Pagination;


