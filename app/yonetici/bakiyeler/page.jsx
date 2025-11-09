'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Minus, DollarSign, Download, Eye, BarChart3, User, Store, Package, TrendingUp, X, FileText, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';

const AdminBalancesPage = () => {
  const [balances, setBalances] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exchangeRate, setExchangeRate] = useState(35);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    amount: '',
    operation: 'add',
    reason: '',
  });

  // Filters
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [activeBalanceMin, setActiveBalanceMin] = useState('');
  const [activeBalanceMax, setActiveBalanceMax] = useState('');
  const [totalEarningsMin, setTotalEarningsMin] = useState('');
  const [totalEarningsMax, setTotalEarningsMax] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Statistics
  const [stats, setStats] = useState({
    totalActiveBalance: 0,
    totalActiveBalanceUSD: 0,
    totalEarnings: 0,
    totalEarningsUSD: 0,
    totalWithdrawals: 0,
    totalWithdrawalsUSD: 0,
  });

  useEffect(() => {
    loadBalances();
    loadStats();
  }, [page, search, orderIdFilter, activeBalanceMin, activeBalanceMax, totalEarningsMin, totalEarningsMax, sortBy, sortOrder]);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (orderIdFilter) params.set('orderId', orderIdFilter);
      if (activeBalanceMin) params.set('activeBalanceMin', activeBalanceMin);
      if (activeBalanceMax) params.set('activeBalanceMax', activeBalanceMax);
      if (totalEarningsMin) params.set('totalEarningsMin', totalEarningsMin);
      if (totalEarningsMax) params.set('totalEarningsMax', totalEarningsMax);

      const res = await fetch(`/api/admin/balances?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setBalances(data.balances);
        setTotal(data.total);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      }
    } catch (error) {
      console.error('Load balances error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load all balances for statistics
      const res = await fetch(`/api/admin/balances?pageSize=1000`);
      const data = await res.json();
      if (data.ok && data.balances) {
        const allBalances = data.balances;
        
        const totals = allBalances.reduce((acc, b) => ({
          activeBalance: acc.activeBalance + b.activeBalance,
          totalEarnings: acc.totalEarnings + b.totalEarnings,
          totalWithdrawals: acc.totalWithdrawals + b.totalWithdrawals,
        }), { activeBalance: 0, totalEarnings: 0, totalWithdrawals: 0 });

        setStats({
          totalActiveBalance: totals.activeBalance,
          totalActiveBalanceUSD: totals.activeBalance / exchangeRate,
          totalEarnings: totals.totalEarnings,
          totalEarningsUSD: totals.totalEarnings / exchangeRate,
          totalWithdrawals: totals.totalWithdrawals,
          totalWithdrawalsUSD: totals.totalWithdrawals / exchangeRate,
        });
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleViewDetails = async (balance) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/balances/${balance.userId}/details`);
      const data = await res.json();
      if (data.ok) {
        setDetailData(data);
        setSelectedBalance(balance);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Load details error:', error);
      alert('Detaylar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = (balance) => {
    setSelectedBalance(balance);
    setUpdateForm({ amount: '', operation: 'add', reason: '' });
    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    if (!updateForm.amount || !selectedBalance) {
      alert('Lütfen tutarı girin');
      return;
    }

    if (!updateForm.reason.trim()) {
      alert('Lütfen sebep girin');
      return;
    }

    const amount = parseFloat(updateForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Geçerli bir tutar girin');
      return;
    }

    if (updateForm.operation === 'subtract' && selectedBalance.activeBalance < amount) {
      alert('Bakiye yetersiz');
      return;
    }

    const operationLabel = updateForm.operation === 'add' ? 'eklemek' : 'çıkarmak';
    const newBalance = updateForm.operation === 'add' 
      ? selectedBalance.activeBalance + amount 
      : selectedBalance.activeBalance - amount;

    if (!confirm(`${amount} TL ${operationLabel} istediğinize emin misiniz?\n\nMevcut Bakiye: ₺${selectedBalance.activeBalance.toFixed(2)}\nYeni Bakiye: ₺${newBalance.toFixed(2)}\n\nSebep: ${updateForm.reason}`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/balances/${selectedBalance.userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Bakiye güncellendi!');
        setShowUpdateModal(false);
        setSelectedBalance(null);
        setUpdateForm({ amount: '', operation: 'add', reason: '' });
        loadBalances();
        loadStats();
      } else {
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleExport = () => {
    const csvHeaders = [
      'Mağaza Adı', 'Email', 'Telefon', 'Aktif Bakiye (TL)', 'Aktif Bakiye (USD)', 
      'Bekleyen Bakiye (TL)', 'Bekleyen Bakiye (USD)', 'Toplam Kazanç (TL)', 'Toplam Kazanç (USD)',
      'Toplam Çekim (TL)', 'Toplam Çekim (USD)', 'Sipariş Sayısı', 'Satış Sayısı', 
      'Son Aktivite Tarihi', 'Oluşturulma Tarihi', 'Güncelleme Tarihi'
    ];
    
    const csvRows = balances.map(b => [
      b.user.storeName || `${b.user.firstName} ${b.user.lastName}`,
      b.user.email || '',
      b.user.phone || '',
      b.activeBalance || 0,
      b.activeBalanceUSD || 0,
      b.pendingBalance || 0,
      b.pendingBalanceUSD || 0,
      b.totalEarnings || 0,
      b.totalEarningsUSD || 0,
      b.totalWithdrawals || 0,
      b.totalWithdrawalsUSD || 0,
      b.orderCount || 0,
      b.salesCount || 0,
      b.lastActivityDate ? new Date(b.lastActivityDate).toLocaleString('tr-TR') : '',
      new Date(b.createdAt).toLocaleString('tr-TR'),
      new Date(b.updatedAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bakiyeler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Bakiye Yönetimi</h1>
          <p className='mt-1 text-gray-600'>
            Toplam {total} mağaza • Kur: 1 USD = ₺{exchangeRate.toFixed(4)}
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
              <p className='text-sm font-medium text-gray-600'>Toplam Aktif Bakiye</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                ${stats.totalActiveBalanceUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.totalActiveBalance.toFixed(2)} TRY</p>
            </div>
            <div className='rounded-full bg-green-100 p-3'>
              <DollarSign size={24} className='text-green-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Kazanç</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                ${stats.totalEarningsUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.totalEarnings.toFixed(2)} TRY</p>
            </div>
            <div className='rounded-full bg-blue-100 p-3'>
              <TrendingUp size={24} className='text-blue-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Çekim</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                ${stats.totalWithdrawalsUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.totalWithdrawals.toFixed(2)} TRY</p>
            </div>
            <div className='rounded-full bg-purple-100 p-3'>
              <Minus size={24} className='text-purple-600' />
            </div>
          </div>
        </div>

      </div>

      {/* Gelişmiş Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='mb-4 flex items-center space-x-2'>
          <Filter size={20} className='text-gray-600' />
          <h2 className='text-lg font-semibold text-gray-900'>Filtreler</h2>
        </div>
        <div className='grid gap-4 md:grid-cols-4'>
          <div className='relative md:col-span-2'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Ara (isim, email, mağaza)'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <input
              type='text'
              placeholder='Order ID'
              value={orderIdFilter}
              onChange={(e) => {
                setOrderIdFilter(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
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
            <option value='activeBalance-desc'>Aktif Bakiye (Yüksek → Düşük)</option>
            <option value='activeBalance-asc'>Aktif Bakiye (Düşük → Yüksek)</option>
            <option value='totalEarnings-desc'>Toplam Kazanç (Yüksek → Düşük)</option>
            <option value='totalEarnings-asc'>Toplam Kazanç (Düşük → Yüksek)</option>
            <option value='totalWithdrawals-desc'>Toplam Çekim (Yüksek → Düşük)</option>
            <option value='storeName-asc'>Mağaza Adı (A → Z)</option>
            <option value='storeName-desc'>Mağaza Adı (Z → A)</option>
          </select>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-4'>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Min Aktif Bakiye (₺)</label>
            <input
              type='number'
              value={activeBalanceMin}
              onChange={(e) => {
                setActiveBalanceMin(e.target.value);
                setPage(1);
              }}
              placeholder='0'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Max Aktif Bakiye (₺)</label>
            <input
              type='number'
              value={activeBalanceMax}
              onChange={(e) => {
                setActiveBalanceMax(e.target.value);
                setPage(1);
              }}
              placeholder='Sınırsız'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Min Toplam Kazanç (₺)</label>
            <input
              type='number'
              value={totalEarningsMin}
              onChange={(e) => {
                setTotalEarningsMin(e.target.value);
                setPage(1);
              }}
              placeholder='0'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Max Toplam Kazanç (₺)</label>
            <input
              type='number'
              value={totalEarningsMax}
              onChange={(e) => {
                setTotalEarningsMax(e.target.value);
                setPage(1);
              }}
              placeholder='Sınırsız'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
        </div>
      </div>

      {/* Bakiye Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : balances.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Mağaza</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Aktif Bakiye</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Bekleyen</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Toplam Kazanç</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Toplam Çekim</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>İstatistikler</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Son Aktivite</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => (
                    <tr key={balance.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          {balance.user.profileImage ? (
                            <img
                              src={balance.user.profileImage}
                              alt={balance.user.storeName}
                              className='h-12 w-12 rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-200'>
                              <Store size={24} className='text-gray-500' />
                            </div>
                          )}
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {balance.user.storeName || `${balance.user.firstName} ${balance.user.lastName}`}
                            </p>
                            <p className='text-xs text-gray-500'>{balance.user.email}</p>
                            {balance.user.phone && (
                              <p className='text-xs text-gray-400'>{balance.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className={`font-bold ${balance.activeBalance > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            ${balance.activeBalanceUSD.toFixed(2)} USD
                          </p>
                          <p className='text-xs text-gray-500'>₺{balance.activeBalance.toFixed(2)} TRY</p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='font-semibold text-gray-900'>${balance.pendingBalanceUSD.toFixed(2)} USD</p>
                          <p className='text-xs text-gray-500'>₺{balance.pendingBalance.toFixed(2)} TRY</p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='font-semibold text-gray-900'>${balance.totalEarningsUSD.toFixed(2)} USD</p>
                          <p className='text-xs text-gray-500'>₺{balance.totalEarnings.toFixed(2)} TRY</p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='font-semibold text-gray-900'>${balance.totalWithdrawalsUSD.toFixed(2)} USD</p>
                          <p className='text-xs text-gray-500'>₺{balance.totalWithdrawals.toFixed(2)} TRY</p>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1 text-sm text-gray-600'>
                          <div className='flex items-center space-x-1'>
                            <Package size={14} />
                            <span>{balance.orderCount || 0} sipariş</span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <TrendingUp size={14} />
                            <span>{balance.salesCount || 0} satış</span>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {balance.lastActivityDate ? (
                          <div>
                            <p>{new Date(balance.lastActivityDate).toLocaleDateString('tr-TR')}</p>
                            <p className='text-xs text-gray-400'>
                              {new Date(balance.lastActivityDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <span className='text-gray-400'>Yok</span>
                        )}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleViewDetails(balance)}
                            className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                            title='Detaylar'
                          >
                            <BarChart3 size={18} />
                          </button>
                          <button
                            onClick={() => handleUpdate(balance)}
                            className='rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700'
                          >
                            Düzenle
                          </button>
                        </div>
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
          <div className='p-12 text-center text-gray-500'>Bakiye bulunamadı</div>
        )}
      </div>

      {/* Bakiye Detay Modalı */}
      {showDetailModal && detailData && selectedBalance && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'
          onClick={() => {
            setShowDetailModal(false);
            setDetailData(null);
            setSelectedBalance(null);
          }}
        >
          <div
            className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Bakiye Detayları</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailData(null);
                  setSelectedBalance(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Mağaza Bilgileri */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Mağaza Bilgileri</h3>
                  <div className='flex items-center space-x-3'>
                    {detailData.balance.user.profileImage ? (
                      <img
                        src={detailData.balance.user.profileImage}
                        alt={detailData.balance.user.storeName}
                        className='h-16 w-16 rounded-full object-cover'
                      />
                    ) : (
                      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-200'>
                        <Store size={32} className='text-gray-500' />
                      </div>
                    )}
                    <div>
                      <p className='font-semibold text-gray-900'>
                        {detailData.balance.user.storeName ||
                          `${detailData.balance.user.firstName} ${detailData.balance.user.lastName}`}
                      </p>
                      <p className='text-sm text-gray-600'>{detailData.balance.user.email}</p>
                      {detailData.balance.user.phone && (
                        <p className='text-sm text-gray-600'>{detailData.balance.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bakiye Özeti */}
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Bakiye Özeti</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs text-gray-600'>Aktif Bakiye</p>
                      <p className='mt-1 text-lg font-bold text-green-600'>
                        ${detailData.balance.activeBalanceUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailData.balance.activeBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>Bekleyen</p>
                      <p className='mt-1 text-lg font-bold text-yellow-600'>
                        ${detailData.balance.pendingBalanceUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailData.balance.pendingBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>Toplam Kazanç</p>
                      <p className='mt-1 text-lg font-bold text-blue-600'>
                        ${detailData.balance.totalEarningsUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailData.balance.totalEarnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>Toplam Çekim</p>
                      <p className='mt-1 text-lg font-bold text-purple-600'>
                        ${detailData.balance.totalWithdrawalsUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailData.balance.totalWithdrawals.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* İstatistikler */}
              <div className='grid gap-4 md:grid-cols-4 rounded-xl bg-gray-50 p-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-gray-900'>{detailData.statistics.totalOrders}</p>
                  <p className='text-sm text-gray-600'>Toplam Sipariş</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-green-600'>{detailData.statistics.salesCount}</p>
                  <p className='text-sm text-gray-600'>Satış</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600'>
                    ₺{detailData.statistics.totalRevenue.toFixed(2)}
                  </p>
                  <p className='text-sm text-gray-600'>Toplam Gelir</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-purple-600'>
                    ₺{detailData.statistics.averageOrder.toFixed(2)}
                  </p>
                  <p className='text-sm text-gray-600'>Ortalama Sipariş</p>
                </div>
              </div>

              {/* Son Siparişler */}
              {detailData.recentOrders && detailData.recentOrders.length > 0 && (
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Son Siparişler</h3>
                  <div className='space-y-2'>
                    {detailData.recentOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className='flex items-center justify-between rounded-lg border border-gray-200 p-3'
                      >
                        <div className='flex items-center space-x-3'>
                          <img
                            src={order.product.coverImage || '/logo.svg'}
                            alt={order.product.title}
                            className='h-10 w-10 rounded-lg object-cover'
                          />
                          <div>
                            <p className='text-sm font-medium text-gray-900'>{order.product.title}</p>
                            <p className='text-xs text-gray-500'>
                              {order.user.firstName} {order.user.lastName}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-bold text-gray-900'>₺{order.amount.toFixed(2)}</p>
                          <p className='text-xs text-gray-500'>
                            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Çekim Geçmişi */}
              {detailData.withdrawals && detailData.withdrawals.length > 0 && (
                <div>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Çekim Geçmişi</h3>
                  <div className='space-y-2'>
                    {detailData.withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className='flex items-center justify-between rounded-lg border border-gray-200 p-3'
                      >
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            ${withdrawal.amountUSD.toFixed(2)} USD
                          </p>
                          <p className='text-xs text-gray-500'>₺{withdrawal.amount.toFixed(2)} TRY</p>
                        </div>
                        <div className='text-right'>
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                              withdrawal.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : withdrawal.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {withdrawal.status === 'APPROVED'
                              ? 'Onaylandı'
                              : withdrawal.status === 'PENDING'
                                ? 'Bekliyor'
                                : 'Reddedildi'}
                          </span>
                          <p className='text-xs text-gray-500 mt-1'>
                            {new Date(withdrawal.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedBalance && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => {
            setShowUpdateModal(false);
            setSelectedBalance(null);
            setUpdateForm({ amount: '', operation: 'add', reason: '' });
          }}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Bakiye Güncelle</h2>
            <p className='mb-2 text-sm text-gray-600'>
              <strong>Mağaza:</strong>{' '}
              {selectedBalance.user.storeName ||
                `${selectedBalance.user.firstName} ${selectedBalance.user.lastName}`}
            </p>
            <div className='mb-4 rounded-lg bg-gray-50 p-3'>
              <p className='text-xs text-gray-600 mb-1'>Mevcut Bakiye</p>
              <p className='text-lg font-bold text-gray-900'>
                ₺{selectedBalance.activeBalance.toFixed(2)} (${selectedBalance.activeBalanceUSD.toFixed(2)} USD)
              </p>
              {updateForm.amount && !isNaN(parseFloat(updateForm.amount)) && (
                <div className='mt-2 pt-2 border-t border-gray-200'>
                  <p className='text-xs text-gray-600 mb-1'>
                    Yeni Bakiye{' '}
                    {updateForm.operation === 'add' ? (
                      <span className='text-green-600'>(+₺{parseFloat(updateForm.amount).toFixed(2)})</span>
                    ) : (
                      <span className='text-red-600'>(-₺{parseFloat(updateForm.amount).toFixed(2)})</span>
                    )}
                  </p>
                  <p className='text-lg font-bold text-gray-900'>
                    ₺
                    {(
                      updateForm.operation === 'add'
                        ? selectedBalance.activeBalance + parseFloat(updateForm.amount)
                        : selectedBalance.activeBalance - parseFloat(updateForm.amount)
                    ).toFixed(2)}
                    {' '}
                    (${((updateForm.operation === 'add'
                      ? selectedBalance.activeBalance + parseFloat(updateForm.amount)
                      : selectedBalance.activeBalance - parseFloat(updateForm.amount)) / exchangeRate).toFixed(2)} USD)
                  </p>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); confirmUpdate(); }} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>İşlem *</label>
                <select
                  value={updateForm.operation}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, operation: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  <option value='add'>Ekle</option>
                  <option value='subtract'>Çıkar</option>
                </select>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Tutar (TL) *</label>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  value={updateForm.amount}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder='0.00'
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Sebep *</label>
                <textarea
                  value={updateForm.reason}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder='Sebep girin...'
                  rows={3}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedBalance(null);
                    setUpdateForm({ amount: '', operation: 'add', reason: '' });
                  }}
                  className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </button>
                <button
                  type='submit'
                  className={`flex-1 rounded-xl px-4 py-2 font-medium text-white ${
                    updateForm.operation === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {updateForm.operation === 'add' ? 'Ekle' : 'Çıkar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBalancesPage;
