'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Eye,
  Store,
  Download,
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  X,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Edit2,
  Trash2,
  Wallet,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';

const AdminStoresPage = () => {
  const [stores, setStores] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exchangeRate, setExchangeRate] = useState(35);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [storeDetails, setStoreDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    storeName: '',
    storeDescription: '',
  });
  const [balanceForm, setBalanceForm] = useState({
    activeBalance: '',
    pendingBalance: '',
    totalEarnings: '',
    totalWithdrawals: '',
  });
  const [stats, setStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeStores: 0,
    totalActiveBalance: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    // Kur bilgisini al
    fetch('/api/exchange-rate')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setExchangeRate(data.rate);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
    loadStores();
  }, [page, search, sortBy, sortOrder]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stores/stats');
      const data = await res.json();
      if (data.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        userType: 'STORE',
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setStores(data.users);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Load stores error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoreDetails = async (storeId) => {
    try {
      setIsLoadingDetails(true);
      const res = await fetch(`/api/admin/users/${storeId}/details`);
      const data = await res.json();
      if (data.ok) {
        setStoreDetails(data);
      } else {
        alert(data.error || 'Mağaza detayları yüklenemedi');
      }
    } catch (error) {
      console.error('Load store details error:', error);
      alert('Bir hata oluştu');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewDetails = (store) => {
    setSelectedStore(store);
    setShowDetailModal(true);
    loadStoreDetails(store.id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStore.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Mağaza güncellendi!');
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedStore(null);
        loadStores();
        if (selectedStore) {
          loadStoreDetails(selectedStore.id);
          setShowDetailModal(true);
        }
      } else {
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!selectedStore) return;

    if (!confirm(`"${selectedStore.storeName || selectedStore.firstName}" mağazasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${selectedStore.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Mağaza silindi!');
        setShowDeleteModal(false);
        setShowDetailModal(false);
        setSelectedStore(null);
        loadStores();
      } else {
        alert(data.error || 'Silme başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/balances/${selectedStore.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeBalance: parseFloat(balanceForm.activeBalance) || 0,
          pendingBalance: parseFloat(balanceForm.pendingBalance) || 0,
          totalEarnings: parseFloat(balanceForm.totalEarnings) || 0,
          totalWithdrawals: parseFloat(balanceForm.totalWithdrawals) || 0,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Bakiye güncellendi!');
        setShowBalanceModal(false);
        loadStoreDetails(selectedStore.id);
      } else {
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Balance update error:', error);
      alert('Bir hata oluştu');
    }
  };

  const openBalanceModal = () => {
    if (storeDetails?.balance) {
      setBalanceForm({
        activeBalance: storeDetails.balance.activeBalance.toString(),
        pendingBalance: storeDetails.balance.pendingBalance.toString(),
        totalEarnings: storeDetails.balance.totalEarnings.toString(),
        totalWithdrawals: storeDetails.balance.totalWithdrawals.toString(),
      });
    } else {
      setBalanceForm({
        activeBalance: '0',
        pendingBalance: '0',
        totalEarnings: '0',
        totalWithdrawals: '0',
      });
    }
    setShowBalanceModal(true);
  };

  const handleExport = async () => {
    try {
      const allStores = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: '100',
          userType: 'STORE',
          sortBy,
          sortOrder,
        });
        if (search) params.set('search', search);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();

        if (data.ok && data.users.length > 0) {
          allStores.push(...data.users);
          if (data.users.length < 100) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      const csvHeaders = [
        'ID',
        'Mağaza Adı',
        'Email',
        'Telefon',
        'Ad Soyad',
        'Ürün Sayısı',
        'Sipariş Sayısı',
        'Aktif Bakiye (TRY)',
        'Aktif Bakiye (USD)',
        'Toplam Kazanç (TRY)',
        'Toplam Kazanç (USD)',
        'Kayıt Tarihi',
      ];

      const csvRows = allStores.map((store) => [
        store.id,
        store.storeName || '',
        store.email,
        store.phone || '',
        `${store.firstName} ${store.lastName}`,
        store._count?.products || 0,
        store._count?.orders || 0,
        store.balance?.activeBalance?.toFixed(2) || '0.00',
        ((store.balance?.activeBalance || 0) / exchangeRate).toFixed(2),
        store.balance?.totalEarnings?.toFixed(2) || '0.00',
        ((store.balance?.totalEarnings || 0) / exchangeRate).toFixed(2),
        new Date(store.createdAt).toLocaleDateString('tr-TR'),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `magazalar_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${allStores.length} mağaza CSV olarak indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export işlemi sırasında bir hata oluştu');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Mağaza Yönetimi</h1>
          <p className='mt-1 text-gray-600'>Toplam {total} mağaza</p>
        </div>
        <button
          onClick={handleExport}
          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className='grid gap-6 md:grid-cols-4'>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Toplam Mağaza</p>
              <p className='mt-2 text-2xl font-bold text-gray-900'>{stats.totalStores}</p>
            </div>
            <div className='rounded-full bg-blue-50 p-3 text-blue-600'>
              <Store size={24} />
            </div>
          </div>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Toplam Ürün</p>
              <p className='mt-2 text-2xl font-bold text-gray-900'>{stats.totalProducts}</p>
            </div>
            <div className='rounded-full bg-green-50 p-3 text-green-600'>
              <Package size={24} />
            </div>
          </div>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Aktif Bakiyeler</p>
              <p className='mt-2 text-2xl font-bold text-gray-900'>
                ${((stats.totalActiveBalance || 0) / exchangeRate).toFixed(2)}
              </p>
              <p className='text-xs text-gray-500'>₺{(stats.totalActiveBalance || 0).toFixed(2)}</p>
            </div>
            <div className='rounded-full bg-yellow-50 p-3 text-yellow-600'>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        <div className='rounded-2xl bg-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Toplam Kazançlar</p>
              <p className='mt-2 text-2xl font-bold text-gray-900'>
                ${((stats.totalEarnings || 0) / exchangeRate).toFixed(2)}
              </p>
              <p className='text-xs text-gray-500'>₺{(stats.totalEarnings || 0).toFixed(2)}</p>
            </div>
            <div className='rounded-full bg-purple-50 p-3 text-purple-600'>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Ara (isim, email, mağaza adı)'
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
            <option value='storeName-asc'>Mağaza Adı (A-Z)</option>
            <option value='storeName-desc'>Mağaza Adı (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Mağaza Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : stores.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Mağaza</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Ürünler</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Siparişler</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Aktif Bakiye</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Toplam Kazanç</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Kayıt</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='h-10 w-10 overflow-hidden rounded-full bg-gray-200'>
                            {store.profileImage ? (
                              <img
                                src={store.profileImage}
                                alt={store.storeName || store.firstName}
                                className='h-full w-full object-cover'
                                onError={(e) => (e.currentTarget.src = '/logo.svg')}
                              />
                            ) : (
                              <div className='flex h-full w-full items-center justify-center text-gray-400'>
                                <Store size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {store.storeName || `${store.firstName} ${store.lastName}`}
                            </p>
                            <p className='text-sm text-gray-500'>{store.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <span className='font-semibold text-gray-900'>{store._count.products || 0}</span>
                          <span className='text-xs text-gray-500'> ürün</span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <span className='font-semibold text-gray-900'>{store._count.orders || 0}</span>
                          <span className='text-xs text-gray-500'> sipariş</span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        {store.balance ? (
                          <div>
                            <p className='font-semibold text-gray-900'>
                              ${((store.balance.activeBalance / exchangeRate).toFixed(2))} USD
                            </p>
                            <p className='text-xs text-gray-500'>₺{store.balance.activeBalance.toFixed(2)} TRY</p>
                          </div>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-6 py-4'>
                        {store.balance ? (
                          <div>
                            <p className='font-semibold text-gray-900'>
                              ${((store.balance.totalEarnings / exchangeRate).toFixed(2))} USD
                            </p>
                            <p className='text-xs text-gray-500'>₺{store.balance.totalEarnings.toFixed(2)} TRY</p>
                          </div>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {new Date(store.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className='px-6 py-4'>
                        <button
                          onClick={() => handleViewDetails(store)}
                          className='inline-block rounded-lg p-2 text-blue-600 hover:bg-blue-50'
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
          <div className='p-12 text-center text-gray-500'>Mağaza bulunamadı</div>
        )}
      </div>

      {/* Mağaza Detay Modal */}
      {showDetailModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => {
            setShowDetailModal(false);
            setSelectedStore(null);
            setStoreDetails(null);
          }}
        >
          <div
            className='w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4'>
              <h2 className='text-xl font-bold text-gray-900'>
                {selectedStore?.storeName || `${selectedStore?.firstName} ${selectedStore?.lastName}`} - Detaylar
              </h2>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setEditForm({
                      firstName: storeDetails?.firstName || '',
                      lastName: storeDetails?.lastName || '',
                      email: storeDetails?.email || '',
                      phone: storeDetails?.phone || '',
                      storeName: storeDetails?.storeName || '',
                      storeDescription: storeDetails?.storeDescription || '',
                    });
                  }}
                  className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                  title='Düzenle'
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={openBalanceModal}
                  className='rounded-lg p-2 text-green-600 hover:bg-green-50'
                  title='Bakiye Güncelle'
                >
                  <Wallet size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className='rounded-lg p-2 text-red-600 hover:bg-red-50'
                  title='Sil'
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedStore(null);
                    setStoreDetails(null);
                  }}
                  className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {isLoadingDetails ? (
              <div className='flex min-h-[400px] items-center justify-center'>
                <div className='text-center'>
                  <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
                  <p className='text-gray-600'>Yükleniyor...</p>
                </div>
              </div>
            ) : storeDetails ? (
              <div className='p-6 space-y-6'>
                {/* Temel Bilgiler */}
                <div className='grid gap-6 md:grid-cols-2'>
                  <div className='rounded-xl border border-gray-200 p-4'>
                    <h3 className='mb-4 font-semibold text-gray-900'>Mağaza Bilgileri</h3>
                    <div className='space-y-3'>
                      <div className='flex items-center space-x-2'>
                        <Store size={18} className='text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>Mağaza Adı</p>
                          <p className='font-medium text-gray-900'>
                            {storeDetails.storeName || `${storeDetails.firstName} ${storeDetails.lastName}`}
                          </p>
                        </div>
                      </div>
                      {storeDetails.storeDescription && (
                        <div>
                          <p className='text-sm text-gray-500'>Açıklama</p>
                          <p className='text-sm text-gray-700'>{storeDetails.storeDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='rounded-xl border border-gray-200 p-4'>
                    <h3 className='mb-4 font-semibold text-gray-900'>İletişim</h3>
                    <div className='space-y-3'>
                      <div className='flex items-center space-x-2'>
                        <Mail size={18} className='text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>Email</p>
                          <p className='font-medium text-gray-900'>{storeDetails.email}</p>
                        </div>
                      </div>
                      {storeDetails.phone && (
                        <div className='flex items-center space-x-2'>
                          <Phone size={18} className='text-gray-400' />
                          <div>
                            <p className='text-sm text-gray-500'>Telefon</p>
                            <p className='font-medium text-gray-900'>{storeDetails.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className='flex items-center space-x-2'>
                        <Calendar size={18} className='text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-500'>Kayıt Tarihi</p>
                          <p className='font-medium text-gray-900'>
                            {new Date(storeDetails.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className='grid gap-4 md:grid-cols-4'>
                  <div className='rounded-xl border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs text-gray-500'>Toplam Ürün</p>
                        <p className='mt-1 text-xl font-bold text-gray-900'>
                          {storeDetails.productStats?.total || 0}
                        </p>
                      </div>
                      <Package size={24} className='text-blue-500' />
                    </div>
                    {storeDetails.productStats && (
                      <div className='mt-2 flex gap-2 text-xs'>
                        <span className='text-green-600'>
                          {storeDetails.productStats.active || 0} Aktif
                        </span>
                        <span className='text-gray-600'>
                          {storeDetails.productStats.passive || 0} Pasif
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='rounded-xl border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs text-gray-500'>Toplam Sipariş</p>
                        <p className='mt-1 text-xl font-bold text-gray-900'>
                          {storeDetails.orderStats?.total || 0}
                        </p>
                      </div>
                      <ShoppingBag size={24} className='text-green-500' />
                    </div>
                  </div>

                  <div className='rounded-xl border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs text-gray-500'>Aktif Bakiye</p>
                        <p className='mt-1 text-xl font-bold text-gray-900'>
                          ${storeDetails.balance ? (storeDetails.balance.activeBalance / exchangeRate).toFixed(2) : '0.00'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          ₺{storeDetails.balance?.activeBalance.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <DollarSign size={24} className='text-yellow-500' />
                    </div>
                  </div>

                  <div className='rounded-xl border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs text-gray-500'>Toplam Kazanç</p>
                        <p className='mt-1 text-xl font-bold text-gray-900'>
                          ${storeDetails.balance ? (storeDetails.balance.totalEarnings / exchangeRate).toFixed(2) : '0.00'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          ₺{storeDetails.balance?.totalEarnings.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <TrendingUp size={24} className='text-purple-500' />
                    </div>
                  </div>
                </div>

                {/* Çekim Talepleri */}
                {storeDetails.withdrawals && storeDetails.withdrawals.length > 0 && (
                  <div className='rounded-xl border border-gray-200 p-4'>
                    <h3 className='mb-4 font-semibold text-gray-900'>Çekim Talepleri</h3>
                    <div className='space-y-2'>
                      {storeDetails.withdrawals.slice(0, 5).map((withdrawal) => (
                        <div
                          key={withdrawal.id}
                          className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                        >
                          <div>
                            <p className='font-medium text-gray-900'>
                              ${(withdrawal.amountUSD || withdrawal.amount / exchangeRate).toFixed(2)} USD
                            </p>
                            <p className='text-xs text-gray-500'>
                              {new Date(withdrawal.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              withdrawal.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : withdrawal.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {withdrawal.status === 'APPROVED'
                              ? 'Onaylandı'
                              : withdrawal.status === 'REJECTED'
                                ? 'Reddedildi'
                                : 'Bekliyor'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Son Siparişler */}
                {storeDetails.recentOrders && storeDetails.recentOrders.length > 0 && (
                  <div className='rounded-xl border border-gray-200 p-4'>
                    <h3 className='mb-4 font-semibold text-gray-900'>Son Siparişler</h3>
                    <div className='space-y-2'>
                      {storeDetails.recentOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
                        >
                          <div>
                            <p className='font-medium text-gray-900'>{order.product?.title || 'Bilinmeyen'}</p>
                            <p className='text-xs text-gray-500'>
                              {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold text-gray-900'>₺{order.amount.toFixed(2)}</p>
                            <span
                              className={`text-xs font-medium ${
                                order.status === 'COMPLETED'
                                  ? 'text-green-600'
                                  : order.status === 'CANCELLED'
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                              }`}
                            >
                              {order.status === 'COMPLETED'
                                ? 'Tamamlandı'
                                : order.status === 'CANCELLED'
                                  ? 'İptal Edildi'
                                  : 'Diğer'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='p-6 text-center text-gray-500'>Detaylar yüklenemedi              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStore && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setShowEditModal(false)}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Mağaza Düzenle</h2>
            <form onSubmit={handleUpdate} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Ad</label>
                <input
                  type='text'
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Soyad</label>
                <input
                  type='text'
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Email</label>
                <input
                  type='email'
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Telefon</label>
                <input
                  type='tel'
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Mağaza Adı</label>
                <input
                  type='text'
                  value={editForm.storeName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, storeName: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Mağaza Açıklaması</label>
                <textarea
                  value={editForm.storeDescription}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, storeDescription: e.target.value }))}
                  rows={4}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </button>
                <button
                  type='submit'
                  className='flex-1 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700'
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStore && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Mağaza Sil</h2>
            <p className='mb-6 text-gray-700'>
              <strong>{selectedStore.storeName || `${selectedStore.firstName} ${selectedStore.lastName}`}</strong> mağazasını silmek istediğinize emin misiniz?
            </p>
            <p className='mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-800'>
              Bu işlem geri alınamaz! Mağazaya ait tüm ürünler, siparişler ve veriler silinecektir.
            </p>
            <div className='flex space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className='flex-1 rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700'
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Update Modal */}
      {showBalanceModal && selectedStore && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setShowBalanceModal(false)}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Bakiye Güncelle</h2>
            <form onSubmit={handleBalanceUpdate} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Aktif Bakiye (₺)</label>
                <input
                  type='number'
                  step='0.01'
                  value={balanceForm.activeBalance}
                  onChange={(e) => setBalanceForm((prev) => ({ ...prev, activeBalance: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Bekleyen Bakiye (₺)</label>
                <input
                  type='number'
                  step='0.01'
                  value={balanceForm.pendingBalance}
                  onChange={(e) => setBalanceForm((prev) => ({ ...prev, pendingBalance: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Toplam Kazanç (₺)</label>
                <input
                  type='number'
                  step='0.01'
                  value={balanceForm.totalEarnings}
                  onChange={(e) => setBalanceForm((prev) => ({ ...prev, totalEarnings: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Toplam Çekimler (₺)</label>
                <input
                  type='number'
                  step='0.01'
                  value={balanceForm.totalWithdrawals}
                  onChange={(e) => setBalanceForm((prev) => ({ ...prev, totalWithdrawals: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => setShowBalanceModal(false)}
                  className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </button>
                <button
                  type='submit'
                  className='flex-1 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700'
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStoresPage;

