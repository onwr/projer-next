'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  CreditCard,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [topStores, setTopStores] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats);
          setRecent(data.recent);
          setTopSellingProducts(data.topSellingProducts || []);
          setTopStores(data.topStores || []);
          setCategoryDistribution(data.categoryDistribution || []);
          setRevenueTrend(data.revenueTrend || []);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
        Veriler yüklenemedi.
      </div>
    );
  }

  const statCards = [
    {
      label: 'Toplam Kullanıcı',
      value: stats.users.total,
      icon: Users,
      color: 'blue',
      subLabel: `${stats.users.stores} mağaza, ${stats.users.admins} admin`,
    },
    {
      label: 'Toplam Ürün',
      value: stats.products.total,
      icon: Package,
      color: 'green',
      subLabel: `${stats.products.approved} onaylı`,
    },
    {
      label: 'Toplam Sipariş',
      value: stats.orders.total,
      icon: ShoppingBag,
      color: 'purple',
      subLabel: `${stats.orders.completed} tamamlanan`,
    },
    {
      label: 'Toplam Gelir',
      value: `₺${stats.revenue.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'yellow',
      subLabel: `Bu ay: ₺${stats.revenue.month.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      label: 'Bekleyen Çekim',
      value: stats.pendingWithdrawals,
      icon: CreditCard,
      color: 'orange',
      subLabel: 'Onay bekliyor',
    },
    {
      label: 'Açık Destek',
      value: stats.openSupportTickets,
      icon: MessageSquare,
      color: 'red',
      subLabel: 'Yanıtlanmamış',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='mt-1 text-gray-600'>Sistem genel bakışı ve istatistikler</p>
      </div>

      {/* İstatistik Kartları */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className='rounded-2xl bg-white p-6 shadow-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>{card.label}</p>
                  <p className='mt-2 text-2xl font-bold text-gray-900'>{card.value}</p>
                  <p className='mt-1 text-xs text-gray-500'>{card.subLabel}</p>
                </div>
                <div className={`rounded-full p-3 ${getColorClasses(card.color)}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gelir Özeti */}
      <div className='grid gap-6 md:grid-cols-4'>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <p className='text-sm text-gray-600'>Bugün</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>
            ₺{stats.revenue.today.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <p className='text-sm text-gray-600'>Bu Hafta</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>
            ₺{stats.revenue.week.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <p className='text-sm text-gray-600'>Bu Ay</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>
            ₺{stats.revenue.month.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <p className='text-sm text-gray-600'>Bu Yıl</p>
          <p className='mt-2 text-2xl font-bold text-gray-900'>
            ₺{stats.revenue.year.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Son Aktiviteler ve En Çok Satanlar */}
      <div className='grid gap-6 lg:grid-cols-1'>
        {/* Son Siparişler */}
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>Son Siparişler</h2>
          {recent?.orders && recent.orders.length > 0 ? (
            <div className='space-y-3'>
              {recent.orders.map((order) => (
                <div
                  key={order.id}
                  className='flex items-center justify-between rounded-xl border border-gray-200 p-4'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='h-12 w-12 overflow-hidden rounded-lg'>
                      <img
                        src={order.product.coverImage || '/logo.svg'}
                        alt={order.product.title}
                        className='h-full w-full object-cover'
                        onError={(e) => (e.currentTarget.src = '/logo.svg')}
                      />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-900'>{order.product.title}</p>
                      <p className='text-xs text-gray-500'>{order.user.name}</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-gray-900'>₺{order.amount.toFixed(2)}</p>
                    <p className='text-xs text-gray-500'>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-center text-gray-500'>Henüz sipariş yok</p>
          )}
        </div>
      </div>

      {/* En Çok Satan Ürünler */}
      {topSellingProducts.length > 0 && (
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>En Çok Satan Ürünler</h2>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Ürün</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Satış</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Gelir</th>
                </tr>
              </thead>
              <tbody>
                {topSellingProducts.slice(0, 10).map((item, index) => (
                  <tr key={item.productId || index} className='border-b border-gray-100'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center space-x-3'>
                        <img
                          src={item.product?.coverImage || '/logo.svg'}
                          alt={item.product?.title}
                          className='h-10 w-10 rounded object-cover'
                          onError={(e) => (e.currentTarget.src = '/logo.svg')}
                        />
                        <div>
                          <p className='font-medium text-gray-900'>{item.product?.title || 'Bilinmeyen'}</p>
                          <p className='text-xs text-gray-500'>{item.product?.category || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-gray-900'>{item.salesCount || 0}</td>
                    <td className='px-4 py-3 font-semibold text-gray-900'>
                      ₺{item.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kategori Dağılımı */}
      {categoryDistribution.length > 0 && (
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>Kategori Dağılımı</h2>
          <div className='space-y-3'>
            {categoryDistribution.map((item, index) => (
              <div key={index} className='flex items-center justify-between'>
                <span className='text-gray-700'>{item.category}</span>
                <span className='font-semibold text-gray-900'>{item.count} ürün</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

