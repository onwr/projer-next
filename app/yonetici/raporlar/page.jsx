'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';

const AdminReportsPage = () => {
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportType, period]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        period,
      });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Load report error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    // TODO: CSV/PDF export
    alert('Export özelliği yakında eklenecek');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Raporlar</h1>
          <p className='mt-1 text-gray-600'>Sistem raporları ve analitik</p>
        </div>
        <button
          onClick={handleExport}
          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Rapor Tipi</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
              }}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value='revenue'>Gelir Raporu</option>
              <option value='users'>Kullanıcı Raporu</option>
              <option value='products'>Ürün Raporu</option>
              <option value='orders'>Sipariş Raporu</option>
              <option value='stores'>Mağaza Raporu</option>
            </select>
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Periyot</label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value='day'>Bugün</option>
              <option value='week'>Bu Hafta</option>
              <option value='month'>Bu Ay</option>
              <option value='year'>Bu Yıl</option>
              <option value='custom'>Özel Tarih</option>
            </select>
          </div>
          {period === 'custom' && (
            <div className='grid gap-2 md:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Başlangıç</label>
                <input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Bitiş</label>
                <input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={loadReport}
          className='mt-4 rounded-xl bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700'
        >
          Rapor Oluştur
        </button>
      </div>

      {/* Rapor İçeriği */}
      {isLoading ? (
        <div className='rounded-2xl bg-white p-12 text-center shadow-lg'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Rapor oluşturuluyor...</p>
        </div>
      ) : report ? (
        <div className='space-y-6'>
          {/* Özet */}
          <div className='rounded-2xl bg-white p-6 shadow-lg'>
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Özet</h2>
            {report.type === 'revenue' && (
              <div className='grid gap-6 md:grid-cols-3'>
                <div>
                  <p className='text-sm text-gray-600'>Toplam Gelir</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    ₺{report.summary.totalRevenue.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Toplam Sipariş</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>{report.summary.totalOrders}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Ortalama Sipariş</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    ₺{report.summary.averageOrder.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            )}

            {report.type === 'users' && (
              <div className='grid gap-6 md:grid-cols-4'>
                <div>
                  <p className='text-sm text-gray-600'>Yeni Kullanıcı</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>{report.summary.totalNewUsers}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Kullanıcı</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byType.USER || 0}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Mağaza</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byType.STORE || 0}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Admin</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byType.ADMIN || 0}
                  </p>
                </div>
              </div>
            )}

            {report.type === 'products' && (
              <div className='grid gap-6 md:grid-cols-4'>
                <div>
                  <p className='text-sm text-gray-600'>Yeni Ürün</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>{report.summary.totalNewProducts}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Onaylı</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byStatus.APPROVED || 0}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Bekliyor</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byStatus.PENDING || 0}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Reddedildi</p>
                  <p className='mt-2 text-3xl font-bold text-gray-900'>
                    {report.summary.byStatus.REJECTED || 0}
                  </p>
                </div>
              </div>
            )}

            {report.type === 'orders' && (
              <div className='space-y-4'>
                {report.summary.byStatus.map((item) => (
                  <div key={item.status} className='flex items-center justify-between rounded-xl bg-gray-50 p-4'>
                    <div>
                      <p className='font-semibold text-gray-900'>{item.status}</p>
                      <p className='text-sm text-gray-600'>{item.count} sipariş</p>
                    </div>
                    <p className='text-xl font-bold text-gray-900'>₺{item.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {report.type === 'stores' && report.summary.topStores && report.summary.topStores.length > 0 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900'>En Çok Kazanan Mağazalar</h3>
                <div className='space-y-3'>
                  {report.summary.topStores.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-xl bg-gray-50 p-4'
                    >
                      <div>
                        <p className='font-semibold text-gray-900'>
                          {item.store?.storeName ||
                            `${item.store?.firstName || ''} ${item.store?.lastName || ''}`.trim() ||
                            'Bilinmeyen'}
                        </p>
                      </div>
                      <p className='text-xl font-bold text-gray-900'>₺{item.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detaylar */}
          {report.breakdown && report.breakdown.length > 0 && (
            <div className='rounded-2xl bg-white p-6 shadow-lg'>
              <h2 className='mb-4 text-xl font-bold text-gray-900'>Günlük Breakdown</h2>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Tarih</th>
                      <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Gelir</th>
                      <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Sipariş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.map((item, index) => (
                      <tr key={index} className='border-b border-gray-100'>
                        <td className='px-4 py-3 text-sm text-gray-900'>
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className='px-4 py-3 font-semibold text-gray-900'>₺{item.revenue.toFixed(2)}</td>
                        <td className='px-4 py-3 text-gray-600'>{item.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.type === 'products' && report.summary.topProducts && (
            <div className='rounded-2xl bg-white p-6 shadow-lg'>
              <h2 className='mb-4 text-xl font-bold text-gray-900'>En Çok Görüntülenen Ürünler</h2>
              <div className='space-y-3'>
                {report.summary.topProducts.map((product) => (
                  <div
                    key={product.id}
                    className='flex items-center justify-between rounded-xl bg-gray-50 p-4'
                  >
                    <div>
                      <p className='font-semibold text-gray-900'>{product.title}</p>
                      <p className='text-xs text-gray-500'>{product.category}</p>
                    </div>
                    <div className='flex space-x-4 text-sm text-gray-600'>
                      <span>👁️ {product.views}</span>
                      <span>⬇️ {product.downloads}</span>
                      <span>❤️ {product.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='rounded-2xl bg-white p-12 text-center text-gray-500 shadow-lg'>
          Rapor oluşturmak için filtreleri seçip "Rapor Oluştur" butonuna tıklayın
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;

