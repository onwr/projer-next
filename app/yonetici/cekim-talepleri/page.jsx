'use client';

import { useEffect, useState } from 'react';
import { Search, Check, X, DollarSign, Download, Eye, BarChart3, User, Store, Calendar, Filter, Clock, CheckCircle, XCircle, AlertCircle, Copy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [exchangeRate, setExchangeRate] = useState(35);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState(null);
  const [detailWithdrawal, setDetailWithdrawal] = useState(null);
  
  // Filters
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Show IBAN
  const [showIBANs, setShowIBANs] = useState({});
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    pendingAmount: 0,
    pendingAmountUSD: 0,
    approved: 0,
    approvedAmount: 0,
    approvedAmountUSD: 0,
    rejected: 0,
    rejectedAmount: 0,
    rejectedAmountUSD: 0,
    averageAmount: 0,
    averageAmountUSD: 0,
    highestAmount: 0,
    highestAmountUSD: 0,
    todayCount: 0,
    todayAmount: 0,
    todayAmountUSD: 0,
    monthlyCount: 0,
    monthlyAmount: 0,
    monthlyAmountUSD: 0,
  });

  useEffect(() => {
    loadWithdrawals();
    loadStats();
  }, [page, search, statusFilter, amountMin, amountMax, dateFrom, dateTo, sortBy, sortOrder]);

  const loadWithdrawals = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (amountMin) params.set('amountMin', amountMin);
      if (amountMax) params.set('amountMax', amountMax);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/withdrawals?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setWithdrawals(data.withdrawals);
        setTotal(data.total);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      }
    } catch (error) {
      console.error('Load withdrawals error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load all withdrawals for statistics
      const res = await fetch(`/api/admin/withdrawals?pageSize=1000`);
      const data = await res.json();
      if (data.ok && data.withdrawals) {
        const allWithdrawals = data.withdrawals;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const pending = allWithdrawals.filter(w => w.status === 'PENDING');
        const approved = allWithdrawals.filter(w => w.status === 'APPROVED');
        const rejected = allWithdrawals.filter(w => w.status === 'REJECTED');
        
        const todayWithdrawals = allWithdrawals.filter(w => new Date(w.createdAt) >= today);
        const monthlyWithdrawals = allWithdrawals.filter(w => new Date(w.createdAt) >= startOfMonth);
        
        const pendingAmount = pending.reduce((sum, w) => sum + w.amount, 0);
        const approvedAmount = approved.reduce((sum, w) => sum + w.amount, 0);
        const rejectedAmount = rejected.reduce((sum, w) => sum + w.amount, 0);
        const todayAmount = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        const monthlyAmount = monthlyWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        const highest = allWithdrawals.reduce((max, w) => 
          w.amount > max.amount ? w : max, 
          allWithdrawals[0] || { amount: 0, amountUSD: 0 }
        );
        
        setStats({
          total: allWithdrawals.length,
          pending: pending.length,
          pendingAmount,
          pendingAmountUSD: pendingAmount / exchangeRate,
          approved: approved.length,
          approvedAmount,
          approvedAmountUSD: approvedAmount / exchangeRate,
          rejected: rejected.length,
          rejectedAmount,
          rejectedAmountUSD: rejectedAmount / exchangeRate,
          averageAmount: allWithdrawals.length > 0 ? allWithdrawals.reduce((sum, w) => sum + w.amount, 0) / allWithdrawals.length : 0,
          averageAmountUSD: allWithdrawals.length > 0 ? (allWithdrawals.reduce((sum, w) => sum + w.amount, 0) / allWithdrawals.length) / exchangeRate : 0,
          highestAmount: highest.amount || 0,
          highestAmountUSD: highest.amountUSD || 0,
          todayCount: todayWithdrawals.length,
          todayAmount,
          todayAmountUSD: todayAmount / exchangeRate,
          monthlyCount: monthlyWithdrawals.length,
          monthlyAmount,
          monthlyAmountUSD: monthlyAmount / exchangeRate,
        });
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleViewDetails = async (withdrawal) => {
    try {
      // Get balance info for this user
      const balanceRes = await fetch(`/api/admin/balances/${withdrawal.user.id}/details`);
      const balanceData = await balanceRes.json().catch(() => null);
      
      setDetailWithdrawal({
        ...withdrawal,
        balance: balanceData?.ok ? balanceData.balance : null,
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('Load details error:', error);
      setDetailWithdrawal(withdrawal);
      setShowDetailModal(true);
    }
  };

  const handleApprove = async (withdrawalId) => {
    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) return;
    
    if (!confirm(`Bu çekim talebini onaylamak istediğinize emin misiniz?\n\nMağaza: ${withdrawal.user.storeName || `${withdrawal.user.firstName} ${withdrawal.user.lastName}`}\nTutar: $${withdrawal.amountUSD.toFixed(2)} USD (₺${withdrawal.amount.toFixed(2)} TRY)`)) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Çekim talebi onaylandı!');
        loadWithdrawals();
        loadStats();
      } else {
        alert(data.error || 'Onaylama başarısız');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleReject = (withdrawalId) => {
    setRejectingWithdrawalId(withdrawalId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Lütfen red sebebi girin');
      return;
    }

    try {
      const res = await fetch(`/api/admin/withdrawals/${rejectingWithdrawalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Çekim talebi reddedildi!');
        setShowRejectModal(false);
        setRejectReason('');
        setRejectingWithdrawalId(null);
        loadWithdrawals();
        loadStats();
      } else {
        alert(data.error || 'Reddetme başarısız');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleToggleIBAN = (withdrawalId) => {
    setShowIBANs((prev) => ({
      ...prev,
      [withdrawalId]: !prev[withdrawalId],
    }));
  };

  const handleCopyIBAN = (iban) => {
    navigator.clipboard.writeText(iban);
    alert('IBAN kopyalandı!');
  };

  const handleExport = () => {
    const csvHeaders = [
      'Çekim ID', 'Mağaza Adı', 'Email', 'Telefon', 'Tutar (USD)', 'Tutar (TL)',
      'Banka Adı', 'Hesap Adı', 'IBAN', 'Durum', 'Oluşturulma Tarihi', 'Güncelleme Tarihi'
    ];
    
    const csvRows = withdrawals.map(w => [
      w.id,
      w.user.storeName || `${w.user.firstName} ${w.user.lastName}`,
      w.user.email || '',
      w.user.phone || '',
      w.amountUSD || 0,
      w.amount || 0,
      w.bankAccount?.bankName || '',
      w.bankAccount?.accountName || '',
      w.bankAccount?.iban || '',
      w.status === 'APPROVED' ? 'Onaylandı' : w.status === 'PENDING' ? 'Bekliyor' : 'Reddedildi',
      new Date(w.createdAt).toLocaleString('tr-TR'),
      new Date(w.updatedAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cekim-talepleri_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Onaylandı';
      case 'PENDING':
        return 'Bekliyor';
      case 'REJECTED':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  // Unique banks for filter
  const banks = Array.from(new Set(withdrawals.map(w => w.bankAccount?.bankName).filter(Boolean)));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Çekim Talepleri</h1>
          <p className='mt-1 text-gray-600'>
            Toplam {total} çekim talebi • Kur: 1 USD = ₺{exchangeRate.toFixed(4)}
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
              <p className='text-sm font-medium text-gray-600'>Bekleyen Çekim</p>
              <p className='mt-2 text-3xl font-bold text-yellow-600'>
                ${stats.pendingAmountUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.pendingAmount.toFixed(2)} TRY</p>
              <p className='text-xs text-gray-400 mt-1'>{stats.pending} talep</p>
            </div>
            <div className='rounded-full bg-yellow-100 p-3'>
              <Clock size={24} className='text-yellow-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Onaylanan Çekim</p>
              <p className='mt-2 text-3xl font-bold text-green-600'>
                ${stats.approvedAmountUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.approvedAmount.toFixed(2)} TRY</p>
              <p className='text-xs text-gray-400 mt-1'>{stats.approved} talep</p>
            </div>
            <div className='rounded-full bg-green-100 p-3'>
              <CheckCircle size={24} className='text-green-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Bu Ay</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                ${stats.monthlyAmountUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.monthlyAmount.toFixed(2)} TRY</p>
              <p className='text-xs text-gray-400 mt-1'>{stats.monthlyCount} talep</p>
            </div>
            <div className='rounded-full bg-purple-100 p-3'>
              <Calendar size={24} className='text-purple-600' />
            </div>
          </div>
        </div>

        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Ortalama Çekim</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>
                ${stats.averageAmountUSD.toFixed(2)} USD
              </p>
              <p className='text-xs text-gray-500'>₺{stats.averageAmount.toFixed(2)} TRY</p>
            </div>
            <div className='rounded-full bg-blue-100 p-3'>
              <TrendingUp size={24} className='text-blue-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Ek İstatistikler */}
      <div className='grid gap-4 md:grid-cols-4'>
        <div className='rounded-2xl bg-white p-4 shadow-lg'>
          <p className='text-xs font-medium text-gray-600'>Bugün</p>
          <p className='mt-1 text-xl font-bold text-gray-900'>{stats.todayCount} talep</p>
          <p className='text-xs text-gray-500'>${stats.todayAmountUSD.toFixed(2)} USD</p>
        </div>
        <div className='rounded-2xl bg-white p-4 shadow-lg'>
          <p className='text-xs font-medium text-gray-600'>Reddedilen</p>
          <p className='mt-1 text-xl font-bold text-red-600'>{stats.rejected}</p>
          <p className='text-xs text-gray-500'>${stats.rejectedAmountUSD.toFixed(2)} USD</p>
        </div>
        <div className='rounded-2xl bg-white p-4 shadow-lg'>
          <p className='text-xs font-medium text-gray-600'>En Yüksek Çekim</p>
          <p className='mt-1 text-xl font-bold text-gray-900'>
            ${stats.highestAmountUSD.toFixed(2)} USD
          </p>
          <p className='text-xs text-gray-500'>₺{stats.highestAmount.toFixed(2)} TRY</p>
        </div>
        <div className='rounded-2xl bg-white p-4 shadow-lg'>
          <p className='text-xs font-medium text-gray-600'>Toplam Talep</p>
          <p className='mt-1 text-xl font-bold text-gray-900'>{stats.total}</p>
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
              placeholder='Ara (mağaza, email, IBAN)'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Durumlar</option>
            <option value='PENDING'>Bekliyor</option>
            <option value='APPROVED'>Onaylandı</option>
            <option value='REJECTED'>Reddedildi</option>
          </select>
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
            <option value='amount-desc'>Tutar (Yüksek → Düşük)</option>
            <option value='amount-asc'>Tutar (Düşük → Yüksek)</option>
            <option value='status-asc'>Durum (A → Z)</option>
          </select>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-4'>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Min Tutar (₺)</label>
            <input
              type='number'
              value={amountMin}
              onChange={(e) => {
                setAmountMin(e.target.value);
                setPage(1);
              }}
              placeholder='0'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Max Tutar (₺)</label>
            <input
              type='number'
              value={amountMax}
              onChange={(e) => {
                setAmountMax(e.target.value);
                setPage(1);
              }}
              placeholder='Sınırsız'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Başlangıç Tarihi</label>
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-gray-600'>Bitiş Tarihi</label>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
        </div>
      </div>

      {/* Çekim Talepleri Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : withdrawals.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Mağaza</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tutar</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Banka Bilgileri</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Durum</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tarih</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          {withdrawal.user.profileImage ? (
                            <img
                              src={withdrawal.user.profileImage}
                              alt={withdrawal.user.storeName}
                              className='h-12 w-12 rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-200'>
                              <Store size={24} className='text-gray-500' />
                            </div>
                          )}
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {withdrawal.user.storeName ||
                                `${withdrawal.user.firstName} ${withdrawal.user.lastName}`}
                            </p>
                            <p className='text-xs text-gray-500'>{withdrawal.user.email}</p>
                            {withdrawal.user.phone && (
                              <p className='text-xs text-gray-400'>{withdrawal.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='font-bold text-gray-900'>${withdrawal.amountUSD.toFixed(2)} USD</p>
                          <p className='text-xs text-gray-500'>₺{withdrawal.amount.toFixed(2)} TRY</p>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {withdrawal.bankAccount ? (
                          <div>
                            <p className='font-medium'>{withdrawal.bankAccount.bankName}</p>
                            <p>{withdrawal.bankAccount.accountName}</p>
                            <div className='mt-1 flex items-center space-x-2'>
                              {showIBANs[withdrawal.id] ? (
                                <div className='flex items-center space-x-2'>
                                  <span className='font-mono text-xs'>{withdrawal.bankAccount.iban}</span>
                                  <button
                                    onClick={() => handleCopyIBAN(withdrawal.bankAccount.iban)}
                                    className='rounded p-1 text-blue-600 hover:bg-blue-50'
                                    title='Kopyala'
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleToggleIBAN(withdrawal.id)}
                                  className='text-xs text-blue-600 hover:text-blue-700'
                                >
                                  IBAN'ı Göster
                                </button>
                              )}
                              {showIBANs[withdrawal.id] && (
                                <button
                                  onClick={() => handleToggleIBAN(withdrawal.id)}
                                  className='text-xs text-gray-500 hover:text-gray-700'
                                >
                                  Gizle
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className='text-gray-400'>Bilinmiyor</span>
                        )}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            withdrawal.status
                          )}`}
                        >
                          {getStatusIcon(withdrawal.status)}
                          <span>{getStatusLabel(withdrawal.status)}</span>
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div>
                          <p>{new Date(withdrawal.createdAt).toLocaleDateString('tr-TR')}</p>
                          <p className='text-xs text-gray-400'>
                            {new Date(withdrawal.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {withdrawal.updatedAt && withdrawal.updatedAt !== withdrawal.createdAt && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Güncellendi: {new Date(withdrawal.updatedAt).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleViewDetails(withdrawal)}
                            className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                            title='Detaylar'
                          >
                            <BarChart3 size={18} />
                          </button>
                          {withdrawal.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(withdrawal.id)}
                                className='rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700'
                                title='Onayla'
                              >
                                <Check size={16} className='inline mr-1' />
                                Onayla
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal.id)}
                                className='rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700'
                                title='Reddet'
                              >
                                <X size={16} className='inline mr-1' />
                                Reddet
                              </button>
                            </>
                          )}
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
          <div className='p-12 text-center text-gray-500'>Çekim talebi bulunamadı</div>
        )}
      </div>

      {/* Çekim Detay Modalı */}
      {showDetailModal && detailWithdrawal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'
          onClick={() => {
            setShowDetailModal(false);
            setDetailWithdrawal(null);
          }}
        >
          <div
            className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Çekim Detayları</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailWithdrawal(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Mağaza ve Çekim Bilgileri */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Mağaza Bilgileri</h3>
                  <div className='flex items-center space-x-3'>
                    {detailWithdrawal.user.profileImage ? (
                      <img
                        src={detailWithdrawal.user.profileImage}
                        alt={detailWithdrawal.user.storeName}
                        className='h-16 w-16 rounded-full object-cover'
                      />
                    ) : (
                      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-200'>
                        <Store size={32} className='text-gray-500' />
                      </div>
                    )}
                    <div>
                      <p className='font-semibold text-gray-900'>
                        {detailWithdrawal.user.storeName ||
                          `${detailWithdrawal.user.firstName} ${detailWithdrawal.user.lastName}`}
                      </p>
                      <p className='text-sm text-gray-600'>{detailWithdrawal.user.email}</p>
                      {detailWithdrawal.user.phone && (
                        <p className='text-sm text-gray-600'>{detailWithdrawal.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Çekim Bilgileri</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Tutar:</span>
                      <div className='text-right'>
                        <span className='font-bold text-gray-900'>
                          ${detailWithdrawal.amountUSD.toFixed(2)} USD
                        </span>
                        <p className='text-xs text-gray-500'>₺{detailWithdrawal.amount.toFixed(2)} TRY</p>
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Durum:</span>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(detailWithdrawal.status)}`}>
                        {getStatusIcon(detailWithdrawal.status)}
                        <span>{getStatusLabel(detailWithdrawal.status)}</span>
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Oluşturulma:</span>
                      <span className='text-gray-900'>{new Date(detailWithdrawal.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    {detailWithdrawal.updatedAt && detailWithdrawal.updatedAt !== detailWithdrawal.createdAt && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Güncelleme:</span>
                        <span className='text-gray-900'>{new Date(detailWithdrawal.updatedAt).toLocaleString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banka Bilgileri */}
              {detailWithdrawal.bankAccount && (
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Banka Bilgileri</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Banka Adı:</span>
                      <span className='font-medium text-gray-900'>{detailWithdrawal.bankAccount.bankName}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Hesap Adı:</span>
                      <span className='font-medium text-gray-900'>{detailWithdrawal.bankAccount.accountName}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>IBAN:</span>
                      <div className='flex items-center space-x-2'>
                        <span className='font-mono text-sm'>{detailWithdrawal.bankAccount.iban}</span>
                        <button
                          onClick={() => handleCopyIBAN(detailWithdrawal.bankAccount.iban)}
                          className='rounded p-1 text-blue-600 hover:bg-blue-50'
                          title='Kopyala'
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bakiye Bilgileri */}
              {detailWithdrawal.balance && (
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Mağaza Bakiyesi</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-xs text-gray-600'>Aktif Bakiye</p>
                      <p className='mt-1 text-lg font-bold text-green-600'>
                        ${detailWithdrawal.balance.activeBalanceUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailWithdrawal.balance.activeBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-600'>Bekleyen Bakiye</p>
                      <p className='mt-1 text-lg font-bold text-yellow-600'>
                        ${detailWithdrawal.balance.pendingBalanceUSD.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>₺{detailWithdrawal.balance.pendingBalance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* İşlem Butonları */}
              {detailWithdrawal.status === 'PENDING' && (
                <div className='flex space-x-3 pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => {
                      handleApprove(detailWithdrawal.id);
                      setShowDetailModal(false);
                    }}
                    className='flex items-center space-x-2 rounded-xl bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700'
                  >
                    <CheckCircle size={18} />
                    <span>Onayla</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleReject(detailWithdrawal.id);
                    }}
                    className='flex items-center space-x-2 rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700'
                  >
                    <XCircle size={18} />
                    <span>Reddet</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setDetailWithdrawal(null);
                    }}
                    className='flex-1 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50'
                  >
                    Kapat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason('');
            setRejectingWithdrawalId(null);
          }}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Çekim Talebini Reddet</h2>
            <p className='mb-4 text-sm text-gray-600'>
              Lütfen red sebebini girin. Bu sebep kullanıcıya bildirilecek.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='Red sebebi...'
              rows={4}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              required
            />
            <div className='mt-4 flex space-x-3'>
              <button
                type='button'
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectingWithdrawalId(null);
                }}
                className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
              >
                İptal
              </button>
              <button
                onClick={confirmReject}
                className='flex-1 rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700'
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalsPage;
