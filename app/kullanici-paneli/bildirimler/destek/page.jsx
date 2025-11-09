import { auth } from '@/lib/auth.js';
import { redirect } from 'next/navigation';

async function getSupportNotifications() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/user/notifications/support`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.notifications || [];
}

export default async function SupportNotificationsPage() {
  const session = await auth();
  if (!session) redirect('/giris');

  const notifications = await getSupportNotifications();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Destek Bildirimleri</h1>
      {notifications.length === 0 ? (
        <div className="rounded-lg border bg-gray-50 p-6 text-gray-600">Bildirim yok</div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-lg border bg-white p-4">
              <p className="font-medium text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-600">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


