import { auth } from '@/lib/auth.js';
import { redirect } from 'next/navigation';

async function getLogs() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/user/logs`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.logs || [];
}

export default async function LoginLogsPage() {
  const session = await auth();
  if (!session) redirect('/giris');

  const logs = await getLogs();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Giriş Kayıtları</h1>
      {logs.length === 0 ? (
        <div className="rounded-lg border bg-gray-50 p-6 text-gray-600">Kayıt yok</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-900">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{l.ip || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


