'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, X, Copy, CheckCircle, XCircle, Clock, Download, BarChart3, DollarSign, Package, TrendingUp, Calendar, Filter, User, Store, FileText } from 'lucide-react';
import Link from 'next/link';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    completed: 0,
    todayCount: 0,
    todayRevenue: 0,
    monthlyCount: 0,
    monthlyRevenue: 0,
    averageOrder: 0,
  });
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  
  // Lists
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Copy to clipboard
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadOrders();
    loadStats();
    loadCategories();
  }, [page, search, storeFilter, categoryFilter, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder]);

  useEffect(() => {
    // Load stores from orders
    const storeSet = new Set();
    orders.forEach(order => {
      if (order.product?.author?.id) {
        storeSet.add(JSON.stringify({
          id: order.product.author.id,
          name: order.product.author.storeName || `${order.product.author.firstName} ${order.product.author.lastName}`,
        }));
      }
    });
    setStores(Array.from(storeSet).map(s => JSON.parse(s)));
  }, [orders]);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.ok && data.flat) {
        // Tüm kategorileri al (sadece isimlerini)
        const categoryNames = data.flat.map(cat => cat.name);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (storeFilter) params.set('storeId', storeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (amountMin) params.set('amountMin', amountMin);
      if (amountMax) params.set('amountMax', amountMax);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load statistics with same filters
      const params = new URLSearchParams();
      if (storeFilter) params.set('storeId', storeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (amountMin) params.set('amountMin', amountMin);
      if (amountMax) params.set('amountMax', amountMax);

      const res = await fetch(`/api/admin/orders?${params.toString()}&pageSize=1000`);
      const data = await res.json();
      if (data.ok && data.orders) {
        const allOrders = data.orders;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
        const monthlyOrders = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth);
        
        const completed = allOrders.filter(o => o.status === 'COMPLETED');
        
        const totalRevenue = completed.reduce((sum, o) => sum + o.amount, 0);
        const todayRevenue = todayOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.amount, 0);
        const monthlyRevenue = monthlyOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.amount, 0);
        
        setStats({
          total: allOrders.length,
          totalRevenue,
          completed: completed.length,
          todayCount: todayOrders.length,
          todayRevenue,
          monthlyCount: monthlyOrders.length,
          monthlyRevenue,
          averageOrder: completed.length > 0 ? totalRevenue / completed.length : 0,
        });
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleViewDetails = async (order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const statusLabel = {
      'COMPLETED': 'tamamlamak',
    }[newStatus] || 'değiştirmek';
    
    if (!confirm(`Bu siparişi ${statusLabel} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert(`Sipariş ${statusLabel}!`);
        loadOrders();
        loadStats();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Status change error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const csvHeaders = [
      'Sipariş ID', 'Müşteri', 'Email', 'Telefon', 'Ürün', 'Kategori', 'Alt Kategori',
      'Mağaza', 'Tutar', 'Oluşturulma Tarihi', 'Güncelleme Tarihi'
    ];
    
    const csvRows = orders.map(o => [
      o.id,
      `${o.user.firstName} ${o.user.lastName}`,
      o.user.email || '',
      o.user.phone || '',
      o.product.title,
      o.product.category || '',
      o.product.subcategory || '',
      o.product.author?.storeName || `${o.product.author?.firstName} ${o.product.author?.lastName}`,
      o.amount || 0,
      new Date(o.createdAt).toLocaleString('tr-TR'),
      new Date(o.updatedAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSelect = (orderId) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedOrders.size === 0) {
      alert('Lütfen en az bir sipariş seçin');
      return;
    }

    const statusLabel = {
      'COMPLETED': 'tamamlamak',
    }[newStatus] || 'değiştirmek';
    
    if (!confirm(`${selectedOrders.size} siparişi ${statusLabel} istediğinize emin misiniz?`)) return;

    try {
      const promises = Array.from(selectedOrders).map((id) =>
        fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        })
      );
      await Promise.all(promises);
      alert(`Siparişler ${statusLabel}!`);
      setSelectedOrders(new Set());
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Bulk status change error:', error);
      alert('Bir hata oluştu');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'PENDING':
        return 'Bekliyor';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} />;
      case 'PENDING':
        return <Clock size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Sipariş Yönetimi</h1>
          <p className='mt-1 text-gray-600'>Toplam {total} sipariş</p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleExport}
            className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            <Download size={18} />
            <span>Export (CSV)</span>
          </button>
          {selectedOrders.size > 0 && (
            <>
              <button
                onClick={() => handleBulkStatusChange('COMPLETED')}
                className='flex items-center space-x-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700'
              >
                <CheckCircle size={18} />
                <span>Toplu Tamamla ({selectedOrders.size})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Sipariş</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>{stats.total}</p>
            </div>
            <div className='rounded-full bg-blue-100 p-3'>
              <Package size={24} className='text-blue-600' />
            </div>
          </div>
        </div>
        
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Toplam Gelir</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>₺{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className='rounded-full bg-green-100 p-3'>
              <DollarSign size={24} className='text-green-600' />
            </div>
          </div>
        </div>
        
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Bu Ay</p>
              <p className='mt-2 text-3xl font-bold text-gray-900'>{stats.monthlyCount}</p>
              <p className='mt-1 text-xs text-gray-500'>₺{stats.monthlyRevenue.toFixed(2)} gelir</p>
            </div>
            <div className='rounded-full bg-purple-100 p-3'>
              <Calendar size={24} className='text-purple-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Ek İstatistikler */}
      <div className='grid gap-4 md:grid-cols-4'>
        <div className='rounded-2xl bg-white p-4 shadow-lg'>
          <p className='text-xs font-medium text-gray-600'>Bugün</p>
          <p className='mt-1 text-xl font-bold text-gray-900'>{stats.todayCount} sipariş</p>
          <p className='text-xs text-gray-500'>₺{stats.todayRevenue.toFixed(2)} gelir</p>
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
              placeholder='Ara (ID, müşteri, ürün)'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
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
            <option value='amount-desc'>Tutar (Yüksek → Düşük)</option>
            <option value='amount-asc'>Tutar (Düşük → Yüksek)</option>
          </select>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-6'>
          <select
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Mağazalar</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
        </div>
      </div>

      {/* Sipariş Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left'>
                      <input
                        type='checkbox'
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={toggleSelectAll}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Sipariş ID</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Ürün</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Müşteri</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Mağaza</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tutar</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tarih</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <input
                          type='checkbox'
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-2'>
                          <p className='font-mono text-sm text-gray-900'>{order.id.substring(0, 12)}...</p>
                          <button
                            onClick={() => handleCopyId(order.id)}
                            className='rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            title='Kopyala'
                          >
                            {copiedId === order.id ? (
                              <CheckCircle size={14} className='text-green-600' />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='h-16 w-16 overflow-hidden rounded-lg bg-gray-200'>
                            <img
                              src={order.product.coverImage || '/logo.svg'}
                              alt={order.product.title}
                              className='h-full w-full object-cover'
                              onError={(e) => (e.currentTarget.src = '/logo.svg')}
                            />
                          </div>
                          <div className='max-w-xs'>
                            <p className='font-semibold text-gray-900 line-clamp-1'>{order.product.title}</p>
                            <p className='text-xs text-gray-500'>{order.product.category}</p>
                            {order.product.subcategory && (
                              <p className='text-xs text-gray-400'>{order.product.subcategory}</p>
                            )}
                            <p className='text-xs text-gray-400 mt-1'>
                              {order.product.isFree ? (
                                <span className='text-green-600'>Ücretsiz</span>
                              ) : (
                                `₺${order.product.price.toFixed(2)}`
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          {order.user.profileImage ? (
                            <img
                              src={order.user.profileImage}
                              alt={order.user.firstName}
                              className='h-10 w-10 rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-200'>
                              <User size={20} className='text-gray-500' />
                            </div>
                          )}
                          <div>
                            <p className='font-medium text-gray-900'>
                              {order.user.firstName} {order.user.lastName}
                            </p>
                            <p className='text-xs text-gray-500'>{order.user.email}</p>
                            {order.user.phone && (
                              <p className='text-xs text-gray-400'>{order.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-2'>
                          {order.product.author?.profileImage && (
                            <img
                              src={order.product.author.profileImage}
                              alt={order.product.author.storeName}
                              className='h-8 w-8 rounded-full object-cover'
                            />
                          )}
                          <div>
                            <p className='text-sm font-medium text-gray-900'>
                              {order.product.author?.storeName ||
                                `${order.product.author?.firstName} ${order.product.author?.lastName}`}
                            </p>
                            <p className='text-xs text-gray-500'>{order.product.author?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='font-bold text-gray-900'>
                          {order.amount === 0 ? (
                            <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700'>
                              Ücretsiz
                            </span>
                          ) : (
                            `₺${order.amount.toFixed(2)}`
                          )}
                        </p>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div>
                          <p>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                          <p className='text-xs text-gray-400'>
                            {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {order.updatedAt && order.updatedAt !== order.createdAt && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Güncellendi: {new Date(order.updatedAt).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleViewDetails(order)}
                            className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                            title='Detaylar'
                          >
                            <BarChart3 size={18} />
                          </button>
                          <Link
                            href={`/urun/${order.product.slug || order.product.id}`}
                            target='_blank'
                            className='rounded-lg p-2 text-gray-600 hover:bg-gray-50'
                            title='Ürünü Görüntüle'
                          >
                            <Eye size={18} />
                          </Link>
                          {order.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                              className='rounded-lg p-2 text-green-600 hover:bg-green-50'
                              title='Tamamla'
                            >
                              <CheckCircle size={18} />
                            </button>
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
          <div className='p-12 text-center text-gray-500'>Sipariş bulunamadı</div>
        )}
      </div>

      {/* Sipariş Detay Modalı */}
      {showDetailModal && detailOrder && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'
          onClick={() => {
            setShowDetailModal(false);
            setDetailOrder(null);
          }}
        >
          <div
            className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Sipariş Detayları</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailOrder(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Sipariş Bilgileri */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Sipariş Bilgileri</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Sipariş ID:</span>
                      <span className='font-mono font-medium text-gray-900'>{detailOrder.id}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Durum:</span>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(detailOrder.status)}`}>
                        {getStatusIcon(detailOrder.status)}
                        <span>{getStatusLabel(detailOrder.status)}</span>
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Tutar:</span>
                      <span className='font-bold text-gray-900'>
                        {detailOrder.amount === 0 ? (
                          <span className='text-green-600'>Ücretsiz</span>
                        ) : (
                          `₺${detailOrder.amount.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Oluşturulma:</span>
                      <span className='text-gray-900'>{new Date(detailOrder.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    {detailOrder.updatedAt && detailOrder.updatedAt !== detailOrder.createdAt && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Güncelleme:</span>
                        <span className='text-gray-900'>{new Date(detailOrder.updatedAt).toLocaleString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Ürün Bilgileri</h3>
                  <div className='flex items-center space-x-3'>
                    <img
                      src={detailOrder.product.coverImage || '/logo.svg'}
                      alt={detailOrder.product.title}
                      className='h-20 w-20 rounded-lg object-cover'
                    />
                    <div>
                      <p className='font-semibold text-gray-900'>{detailOrder.product.title}</p>
                      <p className='text-sm text-gray-600'>{detailOrder.product.category}</p>
                      {detailOrder.product.subcategory && (
                        <p className='text-xs text-gray-500'>{detailOrder.product.subcategory}</p>
                      )}
                      <p className='text-sm text-gray-600 mt-1'>
                        {detailOrder.product.isFree ? (
                          <span className='text-green-600'>Ücretsiz</span>
                        ) : (
                          `₺${detailOrder.product.price.toFixed(2)}`
                        )}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/urun/${detailOrder.product.slug || detailOrder.product.id}`}
                    target='_blank'
                    className='mt-3 inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700'
                  >
                    <Eye size={14} />
                    <span>Ürünü Görüntüle</span>
                  </Link>
                </div>
              </div>

              {/* Müşteri ve Mağaza Bilgileri */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Müşteri Bilgileri</h3>
                  <div className='flex items-center space-x-3'>
                    {detailOrder.user.profileImage ? (
                      <img
                        src={detailOrder.user.profileImage}
                        alt={detailOrder.user.firstName}
                        className='h-12 w-12 rounded-full object-cover'
                      />
                    ) : (
                      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-200'>
                        <User size={24} className='text-gray-500' />
                      </div>
                    )}
                    <div>
                      <p className='font-semibold text-gray-900'>
                        {detailOrder.user.firstName} {detailOrder.user.lastName}
                      </p>
                      <p className='text-sm text-gray-600'>{detailOrder.user.email}</p>
                      {detailOrder.user.phone && (
                        <p className='text-sm text-gray-600'>{detailOrder.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className='rounded-xl bg-gray-50 p-4'>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>Mağaza Bilgileri</h3>
                  <div className='flex items-center space-x-3'>
                    {detailOrder.product.author?.profileImage && (
                      <img
                        src={detailOrder.product.author.profileImage}
                        alt={detailOrder.product.author.storeName}
                        className='h-12 w-12 rounded-full object-cover'
                      />
                    )}
                    <div>
                      <p className='font-semibold text-gray-900'>
                        {detailOrder.product.author?.storeName ||
                          `${detailOrder.product.author?.firstName} ${detailOrder.product.author?.lastName}`}
                      </p>
                      <p className='text-sm text-gray-600'>{detailOrder.product.author?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* İşlem Butonları */}
              <div className='flex space-x-3 pt-4 border-t border-gray-200'>
                {detailOrder.status !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      handleStatusChange(detailOrder.id, 'COMPLETED');
                      setShowDetailModal(false);
                    }}
                    className='flex items-center space-x-2 rounded-xl bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700'
                  >
                    <CheckCircle size={18} />
                    <span>Tamamla</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailOrder(null);
                  }}
                  className='flex-1 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50'
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
