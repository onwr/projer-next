'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Download, Eye, Globe, MapPin, Monitor, Smartphone, Tablet, Calendar, User, FileText, X, BarChart3 } from 'lucide-react';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    topActions: [],
    topCountries: [],
    topBrowsers: [],
    topDevices: [],
  });
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLog, setDetailLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, userIdFilter, ipFilter, countryFilter, entityTypeFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (actionFilter) params.set('action', actionFilter);
      if (userIdFilter) params.set('userId', userIdFilter);
      if (ipFilter) params.set('ipAddress', ipFilter);
      if (countryFilter) params.set('country', countryFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs);
        setTotal(data.total);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setDetailLog(log);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    const csvHeaders = [
      'ID', 'Aksiyon', 'Kullanıcı', 'Email', 'IP Adresi', 'Ülke', 'Şehir', 'Tarayıcı', 'OS', 'Cihaz',
      'Entity Tip', 'Entity ID', 'Açıklama', 'URL', 'Referer', 'Tarih'
    ];
    
    const csvRows = logs.map(log => [
      log.id,
      log.action,
      log.user ? `${log.user.firstName} ${log.user.lastName}` : '-',
      log.user?.email || '-',
      log.ipAddress || '-',
      log.country || '-',
      log.city || '-',
      log.browser || '-',
      log.os || '-',
      log.device || '-',
      log.entityType || '-',
      log.entityId || '-',
      log.description || '-',
      log.url || '-',
      log.referer || '-',
      new Date(log.createdAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aktivite-loglari_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionLabel = (action) => {
    const labels = {
      LOGIN: 'Giriş',
      LOGOUT: 'Çıkış',
      REGISTER: 'Kayıt',
      PRODUCT_CREATE: 'Ürün Oluştur',
      PRODUCT_UPDATE: 'Ürün Güncelle',
      PRODUCT_DELETE: 'Ürün Sil',
      PRODUCT_VIEW: 'Ürün Görüntüle',
      ORDER_CREATE: 'Sipariş Oluştur',
      ORDER_COMPLETE: 'Sipariş Tamamla',
      ORDER_CANCEL: 'Sipariş İptal',
      WITHDRAWAL_CREATE: 'Çekim Talebi',
      WITHDRAWAL_APPROVE: 'Çekim Onayla',
      WITHDRAWAL_REJECT: 'Çekim Reddet',
      PAYMENT_CALLBACK: 'Ödeme Callback',
      ADMIN_APPROVE_PRODUCT: 'Admin Ürün Onayla',
      ADMIN_REJECT_PRODUCT: 'Admin Ürün Reddet',
      ADMIN_UPDATE_USER: 'Admin Kullanıcı Güncelle',
      ADMIN_UPDATE_BALANCE: 'Admin Bakiye Güncelle',
      ADMIN_DELETE_USER: 'Admin Kullanıcı Sil',
      ADMIN_APPROVE_WITHDRAWAL: 'Admin Çekim Onayla',
      ADMIN_REJECT_WITHDRAWAL: 'Admin Çekim Reddet',
    };
    return labels[action] || action;
  };

  const getDeviceIcon = (device) => {
    if (device === 'Mobile') return <Smartphone size={16} />;
    if (device === 'Tablet') return <Tablet size={16} />;
    return <Monitor size={16} />;
  };

  const totalPages = Math.ceil(total / pageSize);

  // Unique values for filters
  const actions = Array.from(new Set(logs.map(l => l.action))).sort();
  const countries = Array.from(new Set(logs.map(l => l.country).filter(Boolean))).sort();
  const entityTypes = Array.from(new Set(logs.map(l => l.entityType).filter(Boolean))).sort();

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Aktivite Logları</h1>
          <p className='mt-1 text-gray-600'>
            Toplam {total} log kaydı • Bugün: {stats.todayCount} • Son 7 gün: {stats.weekCount}
          </p>
        </div>
        <button
          onClick={handleExport}
          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Download size={18} />
          <span>Export (CSV)</span>
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Bugün</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>{stats.todayCount}</p>
            </div>
            <div className='rounded-full bg-blue-100 p-3'>
              <Calendar size={24} className='text-blue-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Son 7 Gün</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>{stats.weekCount}</p>
            </div>
            <div className='rounded-full bg-green-100 p-3'>
              <BarChart3 size={24} className='text-green-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Log</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>{total}</p>
            </div>
            <div className='rounded-full bg-purple-100 p-3'>
              <FileText size={24} className='text-purple-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Benzersiz IP</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                {new Set(logs.map(l => l.ipAddress)).size}
              </p>
            </div>
            <div className='rounded-full bg-orange-100 p-3'>
              <Globe size={24} className='text-orange-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Top Listeler */}
      {stats.topActions.length > 0 && (
        <div className='grid gap-4 md:grid-cols-4'>
          <div className='rounded-2xl bg-white p-4 shadow-lg'>
            <p className='text-xs font-medium text-gray-600 mb-2'>En Çok Yapılan İşlemler</p>
            <div className='space-y-1'>
              {stats.topActions.slice(0, 5).map((item, idx) => (
                <div key={idx} className='flex justify-between text-xs'>
                  <span className='text-gray-700'>{getActionLabel(item.action)}</span>
                  <span className='font-semibold text-gray-900'>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-2xl bg-white p-4 shadow-lg'>
            <p className='text-xs font-medium text-gray-600 mb-2'>En Çok Giriş Yapan Ülkeler</p>
            <div className='space-y-1'>
              {stats.topCountries.slice(0, 5).map((item, idx) => (
                <div key={idx} className='flex justify-between text-xs'>
                  <span className='text-gray-700'>{item.country}</span>
                  <span className='font-semibold text-gray-900'>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-2xl bg-white p-4 shadow-lg'>
            <p className='text-xs font-medium text-gray-600 mb-2'>En Çok Kullanılan Tarayıcılar</p>
            <div className='space-y-1'>
              {stats.topBrowsers.slice(0, 5).map((item, idx) => (
                <div key={idx} className='flex justify-between text-xs'>
                  <span className='text-gray-700'>{item.browser}</span>
                  <span className='font-semibold text-gray-900'>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className='rounded-2xl bg-white p-4 shadow-lg'>
            <p className='text-xs font-medium text-gray-600 mb-2'>Cihaz Dağılımı</p>
            <div className='space-y-1'>
              {stats.topDevices.slice(0, 5).map((item, idx) => (
                <div key={idx} className='flex justify-between text-xs'>
                  <span className='text-gray-700'>{item.device}</span>
                  <span className='font-semibold text-gray-900'>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gelişmiş Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='mb-4 flex items-center space-x-2'>
          <Filter size={20} className='text-gray-600' />
          <h2 className='text-lg font-semibold text-gray-900'>Filtreler</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-4'>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Aksiyonlar</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>
          <input
            type='text'
            placeholder='Kullanıcı ID'
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          />
          <input
            type='text'
            placeholder='IP Adresi'
            value={ipFilter}
            onChange={(e) => {
              setIpFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          />
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Ülkeler</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-4'>
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Entity Tipleri</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type='date'
            placeholder='Başlangıç Tarihi'
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          />
          <input
            type='date'
            placeholder='Bitiş Tarihi'
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value='createdAt-desc'>Yeni → Eski</option>
            <option value='createdAt-asc'>Eski → Yeni</option>
            <option value='action-asc'>Aksiyon (A → Z)</option>
            <option value='action-desc'>Aksiyon (Z → A)</option>
          </select>
        </div>
      </div>

      {/* Log Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tarih</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Aksiyon</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Kullanıcı</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>IP & Konum</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Cihaz</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Açıklama</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div>
                          <p>{new Date(log.createdAt).toLocaleDateString('tr-TR')}</p>
                          <p className='text-xs text-gray-400'>
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700'>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        {log.user ? (
                          <div className='flex items-center space-x-2'>
                            {log.user.profileImage ? (
                              <img
                                src={log.user.profileImage}
                                alt={log.user.email}
                                className='h-8 w-8 rounded-full object-cover'
                              />
                            ) : (
                              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200'>
                                <User size={16} className='text-gray-500' />
                              </div>
                            )}
                            <div>
                              <p className='text-sm font-medium text-gray-900'>
                                {log.user.firstName} {log.user.lastName}
                              </p>
                              <p className='text-xs text-gray-500'>{log.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className='text-sm text-gray-400'>Anonim</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm'>
                        <div>
                          <p className='font-mono text-xs text-gray-900'>{log.ipAddress}</p>
                          {log.city && log.country && (
                            <p className='text-xs text-gray-500'>
                              {log.city}, {log.country}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-2'>
                          <span className='text-gray-400'>{getDeviceIcon(log.device)}</span>
                          <div>
                            <p className='text-xs text-gray-900'>{log.browser}</p>
                            <p className='text-xs text-gray-500'>{log.os}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <p className='truncate max-w-xs'>{log.description}</p>
                      </td>
                      <td className='px-6 py-4'>
                        <button
                          onClick={() => handleViewDetails(log)}
                          className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                          title='Detaylar'
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='border-t border-gray-200 px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    Sayfa {page} / {totalPages}
                  </p>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className='rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50'
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className='rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50'
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='p-12 text-center text-gray-500'>Log kaydı bulunamadı</div>
        )}
      </div>

      {/* Log Detay Modalı */}
      {showDetailModal && detailLog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'
          onClick={() => {
            setShowDetailModal(false);
            setDetailLog(null);
          }}
        >
          <div
            className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Log Detayları</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailLog(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Genel Bilgiler */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Genel Bilgiler</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Aksiyon:</span>
                      <span className='font-medium text-gray-900'>{getActionLabel(detailLog.action)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Entity Tip:</span>
                      <span className='font-medium text-gray-900'>{detailLog.entityType || '-'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Entity ID:</span>
                      <span className='font-mono text-xs text-gray-900'>{detailLog.entityId || '-'}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Tarih:</span>
                      <span className='text-gray-900'>{new Date(detailLog.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Kullanıcı Bilgileri</h3>
                  {detailLog.user ? (
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Ad Soyad:</span>
                        <span className='font-medium text-gray-900'>
                          {detailLog.user.firstName} {detailLog.user.lastName}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Email:</span>
                        <span className='text-gray-900'>{detailLog.user.email}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Kullanıcı Tipi:</span>
                        <span className='text-gray-900'>{detailLog.user.userType}</span>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-400'>Anonim kullanıcı</p>
                  )}
                </div>
              </div>

              {/* Coğrafi Bilgiler */}
              <div className='rounded-xl bg-gray-50 p-4'>
                <h3 className='mb-3 text-sm font-semibold text-gray-700'>Coğrafi Bilgiler</h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>IP Adresi:</span>
                    <p className='font-mono text-sm text-gray-900'>{detailLog.ipAddress}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Ülke:</span>
                    <p className='text-gray-900'>{detailLog.country || '-'}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Şehir:</span>
                    <p className='text-gray-900'>{detailLog.city || '-'}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Bölge:</span>
                    <p className='text-gray-900'>{detailLog.region || '-'}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Zaman Dilimi:</span>
                    <p className='text-gray-900'>{detailLog.timezone || '-'}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>ISP:</span>
                    <p className='text-gray-900'>{detailLog.isp || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Teknik Bilgiler */}
              <div className='rounded-xl bg-gray-50 p-4'>
                <h3 className='mb-3 text-sm font-semibold text-gray-700'>Teknik Bilgiler</h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>Tarayıcı:</span>
                    <p className='text-gray-900'>{detailLog.browser || '-'}</p>
                    {detailLog.browserVersion && (
                      <p className='text-xs text-gray-500'>v{detailLog.browserVersion}</p>
                    )}
                  </div>
                  <div>
                    <span className='text-gray-600'>İşletim Sistemi:</span>
                    <p className='text-gray-900'>{detailLog.os || '-'}</p>
                    {detailLog.osVersion && (
                      <p className='text-xs text-gray-500'>v{detailLog.osVersion}</p>
                    )}
                  </div>
                  <div>
                    <span className='text-gray-600'>Cihaz:</span>
                    <p className='text-gray-900'>{detailLog.device || '-'}</p>
                  </div>
                  <div>
                    <span className='text-gray-600'>Referer:</span>
                    <p className='text-xs text-gray-900 truncate'>{detailLog.referer || '-'}</p>
                  </div>
                  <div className='col-span-2'>
                    <span className='text-gray-600'>URL:</span>
                    <p className='text-xs text-gray-900 truncate'>{detailLog.url || '-'}</p>
                  </div>
                  {detailLog.userAgent && (
                    <div className='col-span-2'>
                      <span className='text-gray-600'>User Agent:</span>
                      <p className='text-xs text-gray-500 font-mono break-all'>{detailLog.userAgent}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Açıklama ve Metadata */}
              <div className='rounded-xl bg-gray-50 p-4'>
                <h3 className='mb-3 text-sm font-semibold text-gray-700'>Açıklama</h3>
                <p className='text-sm text-gray-900'>{detailLog.description}</p>
              </div>

              {detailLog.metadata && (
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Metadata</h3>
                  <pre className='text-xs text-gray-700 bg-white p-3 rounded-lg overflow-auto'>
                    {JSON.stringify(detailLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogsPage;
