'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Package, DollarSign, ShoppingBag, MessageSquare, Check, Plus, XCircle, CreditCard, AlertCircle, BookOpen, Heart, User, Settings } from 'lucide-react';
import ProductsToolbar from '@/components/ui/ProductsToolbar';

const StorePanelPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);


  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productSort, setProductSort] = useState('newest');
  const [productPageSize, setProductPageSize] = useState(12);

  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Balance state
  const [balance, setBalance] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [withdrawalAmountUSD, setWithdrawalAmountUSD] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [newBankData, setNewBankData] = useState({
    bankName: '',
    accountName: '',
    iban: '',
  });
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Dashboard verilerini yükle
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    let ignore = false;
    const loadDashboard = async () => {
      try {
        setIsLoadingDashboard(true);
        const res = await fetch('/api/store/dashboard', { cache: 'no-store' });
        const data = await res.json();
        if (!ignore && data.ok) {
          setDashboardStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (_) {
        if (!ignore) {
          setDashboardStats(null);
          setRecentOrders([]);
        }
      } finally {
        if (!ignore) setIsLoadingDashboard(false);
      }
    };
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Products verilerini yükle
  useEffect(() => {
    if (activeTab !== 'products') return;
    let ignore = false;
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const meRes = await fetch('/api/user/me');
        if (!meRes.ok) {
          if (!ignore) setProducts([]);
          return;
        }
        const me = await meRes.json();
        if (!me?.user?.id) {
          if (!ignore) setProducts([]);
          return;
        }
        const params = new URLSearchParams({
          authorId: me.user.id,
          pageSize: String(productPageSize),
          sort: productSort,
        });
        if (productQuery.trim()) {
          params.set('q', productQuery.trim());
        }
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.ok && Array.isArray(data.items)) {
          setProducts(data.items);
        } else if (!ignore) {
          setProducts([]);
        }
      } catch (_) {
        if (!ignore) setProducts([]);
      } finally {
        if (!ignore) setIsLoadingProducts(false);
      }
    };
    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [activeTab, productQuery, productSort, productPageSize]);

  useEffect(() => {
    if (activeTab !== 'support') return;
    let ignore = false;
    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true);
        const res = await fetch('/api/support-tickets', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!ignore) setTickets(Array.isArray(data.items) ? data.items : []);
      } catch (_) {
        if (!ignore) setTickets([]);
      } finally {
        if (!ignore) setIsLoadingTickets(false);
      }
    };
    loadTickets();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Balance verilerini yükle
  useEffect(() => {
    if (activeTab !== 'balance') return;
    let ignore = false;
    const loadBalance = async () => {
      try {
        setIsLoadingBalance(true);
        setIsLoadingBankAccounts(true);
        const [balanceRes, withdrawalsRes, bankAccountsRes] = await Promise.all([
          fetch('/api/balance', { cache: 'no-store' }),
          fetch('/api/withdrawals', { cache: 'no-store' }),
          fetch('/api/bank-accounts', { cache: 'no-store' }),
        ]);
        const balanceData = await balanceRes.json().catch(() => null);
        const withdrawalsData = await withdrawalsRes.json().catch(() => ({}));
        const bankAccountsData = await bankAccountsRes.json().catch(() => ({}));
        if (!ignore) {
          if (balanceData?.ok) {
            const { ok, ...balance } = balanceData;
            setBalance(balance);
          } else {
            setBalance(null);
          }
          if (withdrawalsData?.ok) {
            setWithdrawals(Array.isArray(withdrawalsData.withdrawals) ? withdrawalsData.withdrawals : []);
          } else {
            setWithdrawals([]);
          }
          if (bankAccountsData?.ok) {
            setBankAccounts(Array.isArray(bankAccountsData.bankAccounts) ? bankAccountsData.bankAccounts : []);
          } else {
            setBankAccounts([]);
          }
        }
      } catch (_) {
        if (!ignore) {
          setBalance(null);
          setWithdrawals([]);
          setBankAccounts([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingBalance(false);
          setIsLoadingBankAccounts(false);
        }
      }
    };
    loadBalance();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Orders verilerini yükle
  useEffect(() => {
    if (activeTab !== 'orders') return;
    let ignore = false;
    const loadOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const res = await fetch('/api/store/orders', { cache: 'no-store' });
        const data = await res.json();
        if (!ignore && data.ok && Array.isArray(data.items)) {
          setOrders(data.items);
        } else if (!ignore) {
          setOrders([]);
        }
      } catch (_) {
        if (!ignore) setOrders([]);
      } finally {
        if (!ignore) setIsLoadingOrders(false);
      }
    };
    loadOrders();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleEdit = (p) => {
    window.location.href = `/magaza-paneli/urun-ekle?productId=${encodeURIComponent(p.id)}`;
  };

  const handleDelete = async (p) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setProducts((prev) => prev.filter((x) => x.id !== p.id));
        return;
      }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (_) {
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    }
  };

  // Çekim talebi gönderme
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    if (!withdrawalAmountUSD || !selectedBankAccountId) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const amountUSD = parseFloat(withdrawalAmountUSD);
    if (amountUSD < 25) {
      alert('Minimum çekim tutarı $25 USD\'dir');
      return;
    }

    if (!balance || balance.activeBalanceUSD < amountUSD) {
      alert(`Yetersiz bakiye. Mevcut bakiyeniz: $${balance?.activeBalanceUSD?.toFixed(2) || '0.00'} USD`);
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD,
          bankAccountId: selectedBankAccountId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Çekim talebiniz başarıyla gönderildi!');
        setWithdrawalAmountUSD('');
        setSelectedBankAccountId('');
        setShowWithdrawalForm(false);
        
        // Verileri yenile
        const [balanceRes, withdrawalsRes] = await Promise.all([
          fetch('/api/balance', { cache: 'no-store' }),
          fetch('/api/withdrawals', { cache: 'no-store' }),
        ]);
        const balanceData = await balanceRes.json().catch(() => null);
        const withdrawalsData = await withdrawalsRes.json().catch(() => ({}));
        if (balanceData?.ok) {
          const { ok, ...balance } = balanceData;
          setBalance(balance);
        }
        if (withdrawalsData?.ok) {
          setWithdrawals(Array.isArray(withdrawalsData.withdrawals) ? withdrawalsData.withdrawals : []);
        }
      } else {
        alert(data.error || 'Çekim talebi gönderilemedi');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Çekim talebi gönderilirken hata oluştu');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  // Banka hesabı ekleme
  const handleAddBank = async (e) => {
    e.preventDefault();

    if (!newBankData.bankName || !newBankData.accountName || !newBankData.iban) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const cleanedIban = newBankData.iban.replace(/\s/g, '').toUpperCase();
    if (!cleanedIban.startsWith('TR') || cleanedIban.length !== 26) {
      alert('Geçerli bir IBAN girin (TR ile başlayan 26 karakter)');
      return;
    }

    setIsSubmittingBank(true);
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: newBankData.bankName,
          accountName: newBankData.accountName,
          iban: cleanedIban,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Banka hesabı başarıyla eklendi!');
        setNewBankData({ bankName: '', accountName: '', iban: '' });
        setShowAddBankForm(false);
        
        // Banka hesaplarını yenile
        const bankAccountsRes = await fetch('/api/bank-accounts', { cache: 'no-store' });
        const bankAccountsData = await bankAccountsRes.json().catch(() => ({}));
        if (bankAccountsData?.ok) {
          setBankAccounts(Array.isArray(bankAccountsData.bankAccounts) ? bankAccountsData.bankAccounts : []);
        }
      } else {
        alert(data.error || 'Banka hesabı eklenemedi');
      }
    } catch (error) {
      console.error('Add bank error:', error);
      alert('Banka hesabı eklenirken hata oluştu');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  // Banka hesabı silme
  const handleDeleteBank = async (bankId) => {
    if (!confirm('Bu banka hesabını silmek istediğinize emin misiniz?')) return;
    
    try {
      const res = await fetch(`/api/bank-accounts?id=${bankId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Banka hesabı silindi!');
        setBankAccounts((prev) => prev.filter((b) => b.id !== bankId));
      } else {
        alert(data.error || 'Banka hesabı silinemedi');
      }
    } catch (error) {
      console.error('Delete bank error:', error);
      alert('Banka hesabı silinirken hata oluştu');
    }
  };


  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <div className='grid gap-8 lg:grid-cols-4'>
          <div className='lg:col-span-1'>
            <div className='rounded-2xl bg-white p-6 shadow-lg'>
              <nav className='space-y-2'>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <BarChart3 size={20} />
                  <span className='font-medium'>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Package size={20} />
                  <span className='font-medium'>Ürün Yönetimi</span>
                </button>
                <button
                  onClick={() => setActiveTab('balance')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'balance' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <DollarSign size={20} />
                  <span className='font-medium'>Bakiyem</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <ShoppingBag size={20} />
                  <span className='font-medium'>Siparişlerim</span>
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'support' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <MessageSquare size={20} />
                  <span className='font-medium'>Destek</span>
                </button>
                <Link
                  href='/kullanici-paneli/satin-almalar'
                  className='flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 text-gray-600 hover:bg-gray-50'
                >
                  <BookOpen size={20} />
                  <span className='font-medium'>Kütüphanem</span>
                </Link>
                <Link
                  href='/kullanici-paneli'
                  className='flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 text-gray-600 hover:bg-gray-50'
                >
                  <Heart size={20} />
                  <span className='font-medium'>Favorilerim</span>
                </Link>
                <Link
                  href='/kullanici-paneli'
                  className='flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 text-gray-600 hover:bg-gray-50'
                >
                  <Settings size={20} />
                  <span className='font-medium'>Profil Ayarları</span>
                </Link>
              </nav>
            </div>
          </div>

          <div className='lg:col-span-3'>
            {activeTab === 'dashboard' && (
              <div className='space-y-6'>
                {isLoadingDashboard ? (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Yükleniyor...
                  </div>
                ) : dashboardStats ? (
                  <>
                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Toplam Ürün</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {dashboardStats.totalProducts}
                        </p>
                      </div>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Toplam Satış</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          {dashboardStats.totalSales}
                        </p>
                      </div>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Toplam Gelir</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          ₺{dashboardStats.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className='rounded-2xl bg-white p-6 shadow-lg'>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>Son Siparişler</h3>
                      {recentOrders.length > 0 ? (
                        <div className='space-y-3'>
                          {recentOrders.map((o) => (
                            <div
                              key={o.id}
                              className='flex items-center justify-between rounded-xl border border-gray-200 p-4'
                            >
                              <div>
                                <p className='font-semibold text-gray-900'>{o.product}</p>
                                <p className='text-sm text-gray-600'>
                                  {o.customer}
                                </p>
                              </div>
                              <div className='text-right'>
                                <p className='text-lg font-bold text-gray-900'>₺{o.amount.toFixed(2)}</p>
                                <p className='text-xs text-gray-500'>
                                  {new Date(o.orderDate).toLocaleString('tr-TR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-600'>
                          Henüz sipariş bulunmuyor.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Veriler yüklenemedi.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className='space-y-6'>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-2xl font-bold text-gray-900'>Ürünlerim</h2>
                  </div>
                  <ProductsToolbar
                    query={productQuery}
                    onQuery={setProductQuery}
                    selectedCount={0}
                    pageSize={productPageSize}
                    onPageSize={setProductPageSize}
                  />
                  <div className='mt-3 flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>Sırala:</span>
                    <select
                      value={productSort}
                      onChange={(e) => setProductSort(e.target.value)}
                      className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-[#2196f3] focus:outline-none'
                    >
                      <option value='newest'>En Yeni</option>
                      <option value='views'>En Çok Görüntülenen</option>
                      <option value='downloads'>En Çok İndirilen</option>
                      <option value='price_asc'>Fiyat (Artan)</option>
                      <option value='price_desc'>Fiyat (Azalan)</option>
                    </select>
                  </div>
                </div>
                {isLoadingProducts ? (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Yükleniyor...
                  </div>
                ) : products.length > 0 ? (
                  <div className='grid gap-4 md:grid-cols-2'>
                    {products.map((p) => (
                      <div key={p.id} className='rounded-2xl bg-white p-6 shadow-lg'>
                        <div className='flex items-start gap-3'>
                          <img
                            src={p.coverImage || '/logo.svg'}
                            alt={p.title}
                            className='h-16 w-24 rounded-md object-cover ring-1 ring-slate-200'
                            onError={(e) => (e.currentTarget.src = '/logo.svg')}
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='truncate font-semibold text-gray-900'>{p.title}</p>
                            <p className='truncate text-sm text-gray-600'>{p.category}</p>
                            <div className='mt-2 flex items-center justify-between'>
                              {Number(p.price ?? 0) <= 0 ? (
                                <span className='rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700'>
                                  Ücretsiz
                                </span>
                              ) : (
                                <span className='text-gray-900'>₺{p.price}</span>
                              )}
                            </div>
                            <div className='mt-1 flex items-center justify-between text-xs text-gray-500'>
                              <span>{p.downloads ?? 0} indirme</span>
                              <span>{p.views ?? 0} görüntüleme</span>
                            </div>
                          </div>
                        </div>
                        <div className='mt-4 flex items-center justify-end gap-2'>
                          <Link
                            href={`/urun/${p.slug || p.id}`}
                            target='_blank'
                            className='rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'
                          >
                            Önizle
                          </Link>
                          <button
                            onClick={() => handleEdit(p)}
                            className='rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className='rounded-xl border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50'
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Henüz ürün bulunmuyor.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'balance' && (
              <div className='space-y-6'>
                {isLoadingBalance ? (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Yükleniyor...
                  </div>
                ) : balance ? (
                  <>
                    {/* Kur Bilgisi */}
                    {balance.exchangeRate && (
                      <div className='rounded-2xl bg-blue-50 border border-blue-200 p-4'>
                        <p className='text-sm text-blue-700'>
                          <span className='font-semibold'>Güncel Kur:</span> 1 USD = ₺{balance.exchangeRate.toFixed(4)} TRY
                        </p>
                      </div>
                    )}

                    {/* Butonlar */}
                    <div className='flex items-center justify-end gap-3'>
                      <button
                        onClick={() => setShowAddBankForm(!showAddBankForm)}
                        className='flex items-center space-x-2 rounded-xl bg-green-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-green-700'
                      >
                        <Plus size={20} />
                        <span>Banka Ekle</span>
                      </button>
                      <button
                        onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
                        className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700'
                      >
                        <Plus size={20} />
                        <span>Çekim Talebi</span>
                      </button>
                    </div>

                    {/* Bakiye Kartları */}
                    <div className='grid gap-6 md:grid-cols-3'>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Aktif Bakiye</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          ${typeof balance.activeBalanceUSD === 'number' ? balance.activeBalanceUSD.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Bekleyen Çekimler</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          ${typeof balance.pendingBalanceUSD === 'number' ? balance.pendingBalanceUSD.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Toplam Kazanç</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          ${typeof balance.totalEarningsUSD === 'number' ? balance.totalEarningsUSD.toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                    <div className='grid gap-6 md:grid-cols-2'>
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <p className='text-sm text-gray-600'>Toplam Çekimler</p>
                        <p className='text-2xl font-bold text-gray-900'>
                          ${typeof balance.totalWithdrawalsUSD === 'number' ? balance.totalWithdrawalsUSD.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      {dashboardStats && (
                        <div className='rounded-2xl bg-white p-6 shadow-lg'>
                          <p className='text-sm text-gray-600'>Aylık Gelir</p>
                          <p className='text-2xl font-bold text-gray-900'>
                            ${(dashboardStats.monthlyRevenue / (balance.exchangeRate || 35)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Çekim Talebi Formu */}
                    {showWithdrawalForm && (
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <div className='mb-4 flex items-center justify-between'>
                          <h3 className='text-lg font-semibold text-gray-900'>Çekim Talebi Gönder</h3>
                          <button
                            onClick={() => setShowWithdrawalForm(false)}
                            className='text-gray-400 hover:text-gray-600'
                          >
                            <XCircle size={20} />
                          </button>
                        </div>

                        {balance.activeBalanceUSD >= 25 ? (
                          <form onSubmit={handleWithdrawalSubmit} className='space-y-4'>
                            <div>
                              <label className='mb-2 block text-sm font-medium text-gray-700'>
                                Çekim Miktarı (USD)
                              </label>
                              <input
                                type='number'
                                min='25'
                                step='0.01'
                                max={balance.activeBalanceUSD}
                                value={withdrawalAmountUSD}
                                onChange={(e) => setWithdrawalAmountUSD(e.target.value)}
                                placeholder='Minimum $25.00'
                                className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                                required
                              />
                              <p className='mt-1 text-xs text-gray-500'>
                                Maksimum çekilebilir: ${balance.activeBalanceUSD?.toFixed(2) || '0.00'} USD
                              </p>
                            </div>

                            <div>
                              <label className='mb-2 block text-sm font-medium text-gray-700'>Banka Seçin</label>
                              <select
                                value={selectedBankAccountId}
                                onChange={(e) => setSelectedBankAccountId(e.target.value)}
                                className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                                required
                              >
                                <option value=''>Banka Seçin</option>
                                {bankAccounts.map((bank) => (
                                  <option key={bank.id} value={bank.id}>
                                    {bank.bankName} - {bank.accountName}
                                  </option>
                                ))}
                              </select>
                              {bankAccounts.length === 0 && (
                                <p className='mt-1 text-xs text-red-500'>
                                  Önce bir banka hesabı eklemeniz gerekiyor.
                                </p>
                              )}
                            </div>

                            {selectedBankAccountId && (
                              <div className='rounded-lg bg-gray-50 p-4'>
                                <h4 className='mb-2 text-sm font-medium text-gray-700'>Seçilen Banka Bilgileri</h4>
                                {(() => {
                                  const bank = bankAccounts.find((b) => b.id === selectedBankAccountId);
                                  return bank ? (
                                    <div className='text-sm text-gray-600'>
                                      <p><strong>Banka:</strong> {bank.bankName}</p>
                                      <p><strong>Hesap Sahibi:</strong> {bank.accountName}</p>
                                      <p><strong>IBAN:</strong> {bank.iban}</p>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}

                            <button
                              type='submit'
                              disabled={isSubmittingWithdrawal || bankAccounts.length === 0}
                              className='w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
                            >
                              {isSubmittingWithdrawal ? 'Gönderiliyor...' : 'Çekim Talebi Gönder'}
                            </button>
                          </form>
                        ) : (
                          <div className='rounded-lg bg-yellow-50 p-4 text-center'>
                            <AlertCircle size={24} className='mx-auto mb-2 text-yellow-600' />
                            <p className='text-yellow-800'>
                              Çekim talebi gönderebilmek için bakiyenizin en az $25 USD olması gerekir.
                            </p>
                            <p className='mt-1 text-sm text-yellow-600'>
                              Mevcut bakiyeniz: ${balance.activeBalanceUSD?.toFixed(2) || '0.00'} USD
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Banka Ekleme Formu */}
                    {showAddBankForm && (
                      <div className='rounded-2xl bg-white p-6 shadow-lg'>
                        <div className='mb-4 flex items-center justify-between'>
                          <h3 className='text-lg font-semibold text-gray-900'>Yeni Banka Hesabı Ekle</h3>
                          <button
                            onClick={() => setShowAddBankForm(false)}
                            className='text-gray-400 hover:text-gray-600'
                          >
                            <XCircle size={20} />
                          </button>
                        </div>

                        <form onSubmit={handleAddBank} className='space-y-4'>
                          <div className='grid gap-4 md:grid-cols-2'>
                            <div>
                              <label className='mb-2 block text-sm font-medium text-gray-700'>Banka Adı</label>
                              <input
                                type='text'
                                value={newBankData.bankName}
                                onChange={(e) => setNewBankData((prev) => ({ ...prev, bankName: e.target.value }))}
                                placeholder='Örn: Ziraat Bankası'
                                className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none'
                                required
                              />
                            </div>
                            <div>
                              <label className='mb-2 block text-sm font-medium text-gray-700'>
                                Hesap Sahibi Ad Soyad
                              </label>
                              <input
                                type='text'
                                value={newBankData.accountName}
                                onChange={(e) => setNewBankData((prev) => ({ ...prev, accountName: e.target.value }))}
                                placeholder='Ad Soyad'
                                className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none'
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className='mb-2 block text-sm font-medium text-gray-700'>IBAN</label>
                            <input
                              type='text'
                              value={newBankData.iban}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase().replace(/\s/g, '');
                                setNewBankData((prev) => ({ ...prev, iban: value }));
                              }}
                              placeholder='TR12 0001 0001 0001 0001 0001 23'
                              maxLength={26}
                              className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none'
                              required
                            />
                            <p className='mt-1 text-xs text-gray-500'>TR ile başlayan 26 karakter olmalıdır</p>
                          </div>
                          <button
                            type='submit'
                            disabled={isSubmittingBank}
                            className='w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400'
                          >
                            {isSubmittingBank ? 'Ekleniyor...' : 'Banka Hesabını Ekle'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Kayıtlı Banka Hesapları */}
                    <div className='rounded-2xl bg-white p-6 shadow-lg'>
                      <h3 className='mb-6 text-lg font-semibold text-gray-900'>Kayıtlı Banka Hesapları</h3>
                      {isLoadingBankAccounts ? (
                        <div className='py-8 text-center text-gray-500'>Yükleniyor...</div>
                      ) : bankAccounts.length === 0 ? (
                        <div className='py-8 text-center'>
                          <CreditCard size={48} className='mx-auto mb-4 text-gray-300' />
                          <p className='text-gray-500'>Henüz banka hesabı eklenmemiş</p>
                          <p className='mt-2 text-sm text-gray-400'>
                            Çekim talebi gönderebilmek için banka hesabı eklemeniz gerekir
                          </p>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          {bankAccounts.map((bank) => (
                            <div
                              key={bank.id}
                              className='flex items-center justify-between rounded-xl border border-gray-200 p-4 transition-shadow duration-200 hover:shadow-md'
                            >
                              <div className='flex items-center space-x-4'>
                                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-green-500 to-green-600 text-white'>
                                  <CreditCard size={20} />
                                </div>
                                <div>
                                  <p className='font-semibold text-gray-900'>{bank.bankName}</p>
                                  <p className='text-sm text-gray-600'>{bank.accountName}</p>
                                  <p className='text-xs text-gray-500'>{bank.iban}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteBank(bank.id)}
                                className='rounded-full p-2 text-red-500 hover:bg-red-50 hover:text-red-700'
                                title='Hesabı sil'
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Çekim Geçmişi */}
                    <div className='rounded-2xl bg-white p-6 shadow-lg'>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>Çekim Geçmişi</h3>
                      {withdrawals.length > 0 ? (
                        <div className='space-y-3'>
                          {withdrawals.map((w) => (
                            <div
                              key={w.id}
                              className='flex items-center justify-between rounded-xl border border-gray-200 p-4'
                            >
                              <div>
                                <p className='font-semibold text-gray-900'>
                                  ${w.amountUSD?.toFixed(2) || '0.00'} USD
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {w.bankAccount?.bankName || 'Bilinmeyen'} - {w.bankAccount?.accountName || ''}
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>
                                  {w.status === 'PENDING'
                                    ? 'Beklemede'
                                    : w.status === 'APPROVED'
                                      ? 'Tamamlandı'
                                      : 'Reddedildi'}
                                </p>
                              </div>
                              <p className='text-sm text-gray-500'>
                                {new Date(w.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-600'>
                          Henüz çekim geçmişi bulunmuyor.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Veriler yüklenemedi.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className='space-y-6'>
                <h2 className='text-2xl font-bold text-gray-900'>Siparişlerim</h2>
                {isLoadingOrders ? (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Yükleniyor...
                  </div>
                ) : orders.length > 0 ? (
                  <div className='space-y-3'>
                    {orders.map((o) => (
                      <div key={o.id} className='rounded-2xl bg-white p-6 shadow-lg'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-semibold text-gray-900'>{o.product}</p>
                            <p className='text-sm text-gray-600'>
                              {o.customer}
                            </p>
                            <p className='mt-1 text-xs text-gray-500'>{o.category}</p>
                          </div>
                          <div className='text-right'>
                            <p className='text-lg font-bold text-gray-900'>₺{o.amount.toFixed(2)}</p>
                            <p className='text-xs text-gray-500'>
                              {new Date(o.createdAt).toLocaleString('tr-TR')}
                            </p>
                            <span
                              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                o.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : o.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {o.status === 'COMPLETED'
                                ? 'Tamamlandı'
                                : o.status === 'PENDING'
                                  ? 'Beklemede'
                                  : 'İptal Edildi'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-2xl bg-white p-6 text-center text-gray-600 shadow-lg'>
                    Henüz sipariş bulunmuyor.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'support' && (
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-gray-900'>Destek Talepleri</h2>
                  <button
                    onClick={() => setShowCreateTicket(true)}
                    className='rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
                  >
                    Yeni Talep
                  </button>
                </div>
                <div className='grid gap-6 md:grid-cols-3'>
                  <div className='rounded-2xl bg-white p-6 shadow-lg'>
                    <p className='text-sm text-gray-600'>Açık Talepler</p>
                    <p className='text-2xl font-bold text-blue-600'>
                      {tickets.filter((t) => t.status === 'açık').length}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-white p-6 shadow-lg'>
                    <p className='text-sm text-gray-600'>Çözülen Talepler</p>
                    <p className='text-2xl font-bold text-green-600'>
                      {tickets.filter((t) => t.status === 'çözüldü').length}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-white p-6 shadow-lg'>
                    <p className='text-sm text-gray-600'>Toplam Talep</p>
                    <p className='text-2xl font-bold text-gray-900'>{tickets.length}</p>
                  </div>
                </div>
                <div className='rounded-2xl bg-white p-6 shadow-lg'>
                  <div className='space-y-4'>
                    {(isLoadingTickets ? [] : tickets).map((ticket) => (
                      <div
                        key={ticket.id}
                        className='cursor-pointer rounded-xl border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md'
                        onClick={() => {
                          setSelectedTicket(null);
                          fetch(`/api/support-tickets/${ticket.id}`).then(async (r) => {
                            if (!r.ok) return;
                            const d = await r.json().catch(() => ({}));
                            d?.ticket && setSelectedTicket(d.ticket);
                          });
                        }}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='mb-2 flex items-center space-x-3'>
                              <h3 className='font-semibold text-gray-900'>{ticket.subject}</h3>
                              <span className='text-sm text-gray-500'>#{ticket.id}</span>
                            </div>
                            <p className='mb-3 text-sm text-gray-600'>{ticket.category}</p>
                            <div className='flex items-center space-x-4'>
                              <span className='text-xs text-gray-500'>
                                Oluşturulma: {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                              </span>
                              <span className='text-xs text-gray-500'>
                                Son Güncelleme: {new Date(ticket.updatedAt).toLocaleString('tr-TR')}
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center space-x-3'>
                            <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700'>
                              {ticket.priority}
                            </span>
                            <span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600'>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!isLoadingTickets && tickets.length === 0 && (
                      <div className='rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-600'>
                        Henüz bir destek talebi yok.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Basit placeholder modallar */}
            {/* Ürün ekleme artık ayrı sayfada */}

            {showCreateTicket && (
              <div
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                onClick={() => setShowCreateTicket(false)}
              >
                <div
                  className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl'
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>Yeni Destek Talebi</h3>
                  <form
                    className='space-y-3'
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const form = new FormData(formEl);
                      fetch('/api/support-tickets', { method: 'POST', body: form })
                        .then(async (r) => {
                          if (!r.ok) return;
                          setShowCreateTicket(false);
                          formEl.reset();
                          const res = await fetch('/api/support-tickets');
                          const data = await res.json().catch(() => ({}));
                          setTickets(Array.isArray(data.items) ? data.items : []);
                          setActiveTab('support');
                        })
                        .catch(() => {});
                    }}
                  >
                    <input
                      name='subject'
                      className='w-full rounded-xl border px-3 py-2'
                      placeholder='Konu *'
                    />
                    <div className='grid gap-3 md:grid-cols-2'>
                      <select name='category' className='w-full rounded-xl border px-3 py-2'>
                        <option value=''>Kategori *</option>
                        <option value='Teknik Destek'>Teknik Destek</option>
                        <option value='Ödeme'>Ödeme</option>
                        <option value='Hesap'>Hesap</option>
                        <option value='Ürün'>Ürün</option>
                        <option value='Genel'>Genel</option>
                      </select>
                      <select name='priority' className='w-full rounded-xl border px-3 py-2'>
                        <option value=''>Öncelik *</option>
                        <option value='Düşük'>Düşük</option>
                        <option value='Orta'>Orta</option>
                        <option value='Yüksek'>Yüksek</option>
                      </select>
                    </div>
                    <textarea
                      name='description'
                      className='h-28 w-full rounded-xl border px-3 py-2'
                      placeholder='Açıklama *'
                    />
                    <div className='mt-2 flex items-center justify-between'>
                      <span className='text-xs text-gray-500'>
                        Gönderim sonrası kayıt altına alınır
                      </span>
                      <button type='submit' className='rounded-xl bg-blue-600 px-4 py-2 text-white'>
                        Gönder
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {selectedTicket && (
              <div
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                onClick={() => setSelectedTicket(null)}
              >
                <div
                  className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl'
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className='mb-4 flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {selectedTicket.subject}
                      </h3>
                      <p className='text-xs text-gray-500'>#{selectedTicket.id}</p>
                    </div>
                    <button
                      className='rounded-xl bg-gray-900 px-3 py-1.5 text-sm text-white'
                      onClick={() => setSelectedTicket(null)}
                    >
                      Kapat
                    </button>
                  </div>
                  <div className='mb-4 flex items-center gap-2'>
                    <span className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700'>
                      {selectedTicket.priority}
                    </span>
                    <span className='rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600'>
                      {selectedTicket.status}
                    </span>
                    <span className='text-xs text-gray-500'>{selectedTicket.category}</span>
                  </div>
                  <div className='space-y-3'>
                    {selectedTicket.messages.map((m, i) => (
                      <div
                        key={m.id || i}
                        className={`rounded-xl p-4 ${m.sender === 'user' ? 'ml-6 bg-blue-50' : 'mr-6 bg-gray-50'}`}
                      >
                        <div className='mb-1 flex items-center justify-between'>
                          <span className='text-sm font-medium text-gray-900'>
                            {m.sender === 'user' ? 'Siz' : 'Destek Ekibi'}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {new Date(m.createdAt || Date.now()).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className='text-sm text-gray-700'>{m.message}</p>
                      </div>
                    ))}
                  </div>
                  {selectedTicket.status !== 'çözüldü' && (
                    <form
                      className='mt-6 space-y-3 border-t border-gray-200 pt-4'
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formEl = e.currentTarget;
                        const form = new FormData(formEl);
                        const message = (form.get('message') || '').toString();
                        if (!message) return;
                        fetch(`/api/support-tickets/${selectedTicket.id}/messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message }),
                        })
                          .then(async (r) => {
                            const jr = await r.json().catch(() => ({}));
                            if (jr?.ok !== true) return;
                            const detail = await fetch(`/api/support-tickets/${selectedTicket.id}`);
                            const data = await detail.json().catch(() => ({}));
                            formEl.reset();
                            data?.ticket && setSelectedTicket(data.ticket);
                          })
                          .catch(() => {});
                      }}
                    >
                      <textarea
                        name='message'
                        rows={4}
                        placeholder='Yanıtınızı yazın...'
                        className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      />
                      <div className='flex justify-end'>
                        <button
                          type='submit'
                          className='rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
                        >
                          Gönder
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePanelPage;
