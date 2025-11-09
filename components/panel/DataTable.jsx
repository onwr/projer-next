'use client';

export const DataTable = ({ columns = [], rows = [], keyField = 'id' }) => {
  if (!rows?.length) {
    return <div className="rounded-xl border bg-gray-50 p-6 text-gray-600">Kayıt bulunamadı</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={row[keyField] ?? Math.random()}>
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-gray-900">
                  {typeof c.render === 'function' ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;


