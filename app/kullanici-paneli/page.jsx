'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShoppingBag,
  Heart,
  Settings,
  Eye,
  Download,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  X,
  MessageSquare,
  AlertCircle,
  Star,
  Reply,
} from 'lucide-react';

const UserPanelPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [profile, setProfile] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);

  // Dashboard için state'ler
  const [userStats, setUserStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingTickets(true);
        const res = await fetch('/api/support-tickets', { cache: 'no-store' });
        if (!res.ok) throw new Error('Liste alınamadı');
        const data = await res.json();
        setTickets(Array.isArray(data.items) ? data.items : []);
      } catch (_) {
        setTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    load();
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d?.user || null))
      .catch(() => setProfile(null));
  }, []);

  // Dashboard verilerini yükle
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const loadDashboard = async () => {
        try {
          setIsLoadingDashboard(true);
          const res = await fetch('/api/user/dashboard');
          if (!res.ok) throw new Error('Dashboard verileri alınamadı');
          const data = await res.json();
          if (data.ok) {
            setUserStats(data.stats);
            setRecentOrders(data.recentOrders || []);
          }
        } catch (error) {
          console.error('Dashboard load error:', error);
          setUserStats(null);
          setRecentOrders([]);
        } finally {
          setIsLoadingDashboard(false);
        }
      };
      loadDashboard();
    }
  }, [activeTab]);

  // Siparişler tab'ında verileri yükle
  useEffect(() => {
    if (activeTab === 'orders') {
      const loadOrders = async () => {
        try {
          setIsLoadingOrders(true);
          const res = await fetch('/api/user/purchases?status=COMPLETED');
          if (!res.ok) throw new Error('Siparişler alınamadı');
          const data = await res.json();
          if (data.ok) {
            setRecentOrders(data.purchases || []);
          }
        } catch (error) {
          console.error('Orders load error:', error);
          setRecentOrders([]);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      loadOrders();
    }
  }, [activeTab]);

  // Favoriler tab'ında verileri yükle
  useEffect(() => {
    if (activeTab === 'favorites') {
      const loadFavorites = async () => {
        try {
          setIsLoadingFavorites(true);
          const res = await fetch('/api/user/favorites');
          if (!res.ok) throw new Error('Favoriler alınamadı');
          const data = await res.json();
          if (data.ok) {
            setFavoriteProducts(data.favorites || []);
          }
        } catch (error) {
          console.error('Favorites load error:', error);
          setFavoriteProducts([]);
        } finally {
          setIsLoadingFavorites(false);
        }
      };
      loadFavorites();
    }
  }, [activeTab]);

  // Favoriler için filtreleme
  const filteredFavorites = favoriteProducts.filter((product) =>
    favoriteSearchQuery
      ? product.title.toLowerCase().includes(favoriteSearchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(favoriteSearchQuery.toLowerCase())
      : true
  );

  const supportTickets = [
    {
      id: 'TK-001',
      subject: 'Ürün indirme sorunu',
      category: 'Teknik Destek',
      priority: 'Yüksek',
      status: 'açık',
      createdAt: '2025-01-25 10:30',
      lastUpdate: '2025-01-25 14:20',
      messages: [
        {
          id: 1,
          sender: 'user',
          message: 'Satın aldığım ürünü indiremiyorum. Hata mesajı alıyorum.',
          timestamp: '2025-01-25 10:30',
        },
        {
          id: 2,
          sender: 'support',
          message:
            'Merhaba! Sorununuzu çözmek için size yardımcı olacağım. Hangi ürünle ilgili sorun yaşıyorsunuz?',
          timestamp: '2025-01-25 11:15',
        },
        {
          id: 3,
          sender: 'user',
          message:
            'Military Rifle 4 Extra PBR Texture ürünü. İndirme linkine tıkladığımda 404 hatası alıyorum.',
          timestamp: '2025-01-25 12:45',
        },
        {
          id: 4,
          sender: 'support',
          message:
            'Anladım. Bu sorunu çözmek için teknik ekibimizle iletişime geçtim. 2 saat içinde düzeltilecek ve size bilgi verilecek.',
          timestamp: '2025-01-25 14:20',
        },
      ],
    },
    {
      id: 'TK-002',
      subject: 'Ödeme iade talebi',
      category: 'Ödeme',
      priority: 'Orta',
      status: 'çözüldü',
      createdAt: '2025-01-23 16:45',
      lastUpdate: '2025-01-24 09:30',
      messages: [
        {
          id: 1,
          sender: 'user',
          message: 'Yanlışlıkla iki kez ödeme yaptım. İkinci ödemeyi iade etmek istiyorum.',
          timestamp: '2025-01-23 16:45',
        },
        {
          id: 2,
          sender: 'support',
          message:
            'Merhaba! İade talebinizi inceliyorum. Ödeme bilgilerinizi kontrol edip size geri dönüş yapacağım.',
          timestamp: '2025-01-23 17:20',
        },
        {
          id: 3,
          sender: 'support',
          message:
            'İade işleminiz onaylandı. 3-5 iş günü içinde hesabınıza yansıyacak. İade numarası: REF-789456',
          timestamp: '2025-01-24 09:30',
        },
      ],
    },
    {
      id: 'TK-003',
      subject: 'Hesap doğrulama',
      category: 'Hesap',
      priority: 'Düşük',
      status: 'beklemede',
      createdAt: '2025-01-24 14:15',
      lastUpdate: '2025-01-24 14:15',
      messages: [
        {
          id: 1,
          sender: 'user',
          message: 'E-posta doğrulama linki gelmedi. Yeniden gönderebilir misiniz?',
          timestamp: '2025-01-24 14:15',
        },
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'tamamlandi':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
      case 'beklemede':
        return 'text-yellow-600 bg-yellow-50';
      case 'isleniyor':
        return 'text-blue-600 bg-blue-50';
      case 'açık':
        return 'text-blue-600 bg-blue-50';
      case 'çözüldü':
        return 'text-green-600 bg-green-50';
      case 'kapalı':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Yüksek':
        return 'text-red-600 bg-red-50';
      case 'Orta':
        return 'text-yellow-600 bg-yellow-50';
      case 'Düşük':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'tamamlandi':
        return <CheckCircle size={16} />;
      case 'PENDING':
      case 'beklemede':
        return <Clock size={16} />;
      case 'isleniyor':
        return <Clock size={16} />;
      case 'açık':
        return <AlertCircle size={16} />;
      case 'çözüldü':
        return <CheckCircle size={16} />;
      case 'kapalı':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const handleDownload = async (productSlug, productId) => {
    try {
      const res = await fetch(`/api/products/${productSlug || productId}/download`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok && data.files) {
        // Dosyaları indir
        data.files.forEach((file) => {
          if (file.url) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.fileName || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      } else {
        alert(data.error || 'İndirme hatası');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('İndirme işlemi başarısız');
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
                  <User size={20} />
                  <span className='font-medium'>Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <ShoppingBag size={20} />
                  <span className='font-medium'>Kütüphanem</span>
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'favorites' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Heart size={20} />
                  <span className='font-medium'>Favorilerim</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Settings size={20} />
                  <span className='font-medium'>Profil Ayarları</span>
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'support' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <MessageSquare size={20} />
                  <span className='font-medium'>Destek</span>
                </button>
              </nav>
            </div>
          </div>

          <div className='lg:col-span-3'>
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='space-y-6'
              >
                {isLoadingDashboard ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='mb-4 text-lg font-semibold text-gray-600'>Yükleniyor...</div>
                    </div>
                  </div>
                ) : userStats ? (
                  <>
                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className='rounded-2xl bg-white p-6 shadow-lg'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Toplam Model</p>
                            <p className='text-2xl font-bold text-gray-900'>{userStats.totalModels || 0}</p>
                          </div>
                          <div className='rounded-full bg-blue-100 p-3'>
                            <ShoppingBag size={24} className='text-blue-600' />
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className='rounded-2xl bg-white p-6 shadow-lg'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Toplam Harcama</p>
                            <p className='text-2xl font-bold text-gray-900'>₺{userStats.totalSpent?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className='rounded-full bg-green-100 p-3'>
                            <CreditCard size={24} className='text-green-600' />
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className='rounded-2xl bg-white p-6 shadow-lg'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Favori Ürünler</p>
                            <p className='text-2xl font-bold text-gray-900'>
                              {userStats.favoriteProductsCount || 0}
                            </p>
                            <p className='text-xs text-blue-600'>Beğenilen ürünler</p>
                          </div>
                          <div className='rounded-full bg-red-100 p-3'>
                            <Heart size={24} className='text-red-600' />
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className='rounded-2xl bg-white p-6 shadow-lg'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>İndirilen Ürünler</p>
                            <p className='text-2xl font-bold text-gray-900'>
                              {userStats.downloadedProducts || 0}
                            </p>
                            <p className='text-xs text-purple-600'>Satın alınan ürünler</p>
                          </div>
                          <div className='rounded-full bg-purple-100 p-3'>
                            <Download size={24} className='text-purple-600' />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className='rounded-2xl bg-white p-6 shadow-lg'
                    >
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>Hesap Bilgileri</h3>
                      <div className='grid gap-4 md:grid-cols-2'>
                        <div className='flex items-center space-x-3'>
                          <div className='rounded-full bg-blue-100 p-2'>
                            <Calendar size={20} className='text-blue-600' />
                          </div>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Hesap Yaşı</p>
                            <p className='text-lg font-semibold text-gray-900'>
                              {userStats.accountAge || 'Bilinmiyor'}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center space-x-3'>
                          <div className='rounded-full bg-green-100 p-2'>
                            <Clock size={20} className='text-green-600' />
                          </div>
                          <div>
                            <p className='text-sm font-medium text-gray-600'>Kayıt Tarihi</p>
                            <p className='text-lg font-semibold text-gray-900'>{userStats.lastLogin || 'Bilinmiyor'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className='rounded-2xl bg-white p-6 shadow-lg'
                    >
                      <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-gray-900'>Son Siparişler</h3>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className='flex items-center space-x-2 text-blue-600 hover:text-blue-700'
                        >
                          <span className='text-sm font-medium'>Tümünü Gör</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      {recentOrders.length === 0 ? (
                        <div className='py-8 text-center text-gray-500'>Henüz sipariş bulunmuyor</div>
                      ) : (
                        <div className='space-y-4'>
                          {recentOrders.slice(0, 3).map((order, index) => (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                              className='flex items-center justify-between rounded-xl border border-gray-200 p-4'
                            >
                              <div className='flex items-center space-x-4'>
                                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200'>
                                  <img
                                    src={order.coverImage || '/logo.svg'}
                                    alt={order.productTitle}
                                    className='h-8 w-8 object-cover rounded'
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/logo.svg';
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className='font-semibold text-gray-900'>{order.productTitle}</p>
                                  <p className='text-sm text-gray-600'>{order.category}</p>
                                  <div className='mt-1 flex items-center space-x-4'>
                                    <p className='text-xs text-gray-500'>{order.date}</p>
                                  </div>
                                </div>
                              </div>
                              <div className='flex items-center space-x-4'>
                                <span className='text-xl font-bold text-gray-900'>₺{order.price.toFixed(2)}</span>
                                <span
                                  className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                                >
                                  {getStatusIcon(order.status)}
                                  <span className='capitalize'>
                                    {order.status === 'COMPLETED'
                                      ? 'Tamamlandı'
                                      : order.status === 'PENDING'
                                        ? 'Beklemede'
                                        : order.status === 'CANCELLED'
                                          ? 'İptal'
                                          : order.status}
                                  </span>
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </>
                ) : (
                  <div className='rounded-2xl bg-white p-12 shadow-lg text-center text-gray-500'>
                    Veriler yüklenemedi
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='space-y-6'
              >
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-gray-900'>Kütüphanem</h2>
                </div>
                {isLoadingOrders ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='mb-4 text-lg font-semibold text-gray-600'>Yükleniyor...</div>
                    </div>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className='rounded-2xl bg-white p-12 shadow-lg text-center text-gray-500'>
                    Henüz satın alınan ürün bulunmuyor
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {recentOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className='rounded-2xl bg-white p-6 shadow-lg'
                      >
                        <div className='mb-4 flex items-center justify-between'>
                          <div className='flex items-center space-x-4'>
                            <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden'>
                              <img
                                src={order.coverImage || '/logo.svg'}
                                alt={order.productTitle}
                                className='h-full w-full object-cover'
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/logo.svg';
                                }}
                              />
                            </div>
                            <div>
                              <h3 className='text-lg font-semibold text-gray-900'>{order.productTitle}</h3>
                              <div className='mt-1 flex items-center space-x-4'>
                                <p className='text-sm text-gray-500'>Satın alma: {order.date}</p>
                                <p className='text-sm text-gray-500'>
                                  Son indirme: {order.downloadDate}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center space-x-4'>
                            <span className='text-2xl font-bold text-gray-900'>₺{order.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-4'>
                            <button
                              onClick={() => handleDownload(order.productSlug, order.productId)}
                              className='flex items-center space-x-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600 transition-colors duration-200 hover:bg-blue-100'
                            >
                              <Download size={16} />
                              <span>İndir</span>
                            </button>
                            {order.productSlug && (
                              <Link
                                href={`/urun/${order.productSlug}`}
                                className='flex items-center space-x-2 rounded-lg bg-green-50 px-4 py-2 text-green-600 transition-colors duration-200 hover:bg-green-100'
                              >
                                <Eye size={16} />
                                <span>İncele</span>
                              </Link>
                            )}
                          </div>
                          <div className='text-sm text-gray-500'>Sipariş No: {order.id}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='space-y-6'
              >
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-gray-900'>Favorilerim</h2>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`rounded-lg p-2 transition-colors duration-200 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Grid size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`rounded-lg p-2 transition-colors duration-200 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                    <div className='relative'>
                      <Search
                        size={20}
                        className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                      />
                      <input
                        type='text'
                        placeholder='Favori ara...'
                        value={favoriteSearchQuery}
                        onChange={(e) => setFavoriteSearchQuery(e.target.value)}
                        className='w-64 rounded-xl border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      />
                    </div>
                  </div>
                </div>
                {isLoadingFavorites ? (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='mb-4 text-lg font-semibold text-gray-600'>Yükleniyor...</div>
                    </div>
                  </div>
                ) : filteredFavorites.length === 0 ? (
                  <div className='rounded-2xl bg-white p-12 shadow-lg text-center text-gray-500'>
                    {favoriteSearchQuery ? 'Arama sonucu bulunamadı' : 'Henüz favori ürün bulunmuyor'}
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'
                    }
                  >
                    {filteredFavorites.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className={`overflow-hidden rounded-2xl bg-white shadow-lg ${viewMode === 'list' ? 'flex items-center p-6' : 'p-6'}`}
                    >
                      <div
                        className={`${viewMode === 'list' ? 'mr-4 h-20 w-20 flex-shrink-0' : 'mb-4 h-48 w-full'} flex items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden`}
                      >
                        <img
                          src={product.image || '/logo.svg'}
                          alt={product.title}
                          className={viewMode === 'list' ? 'h-full w-full object-cover' : 'h-full w-full object-cover'}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/logo.svg';
                          }}
                        />
                      </div>
                      <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                        <div className='mb-2 flex items-start justify-between'>
                          <h3 className='font-semibold text-gray-900 truncate'>{product.title}</h3>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/user/favorites/${product.slug || product.id}`, {
                                  method: 'POST',
                                });
                                const data = await res.json();
                                if (data.ok) {
                                  // Favoriler listesinden çıkar
                                  setFavoriteProducts((prev) => prev.filter((p) => p.id !== product.id));
                                } else {
                                  alert(data.error || 'Favorilerden çıkarma işlemi başarısız');
                                }
                              } catch (error) {
                                console.error('Remove favorite error:', error);
                                alert('Favorilerden çıkarma işlemi başarısız');
                              }
                            }}
                            className='text-red-500 transition-colors duration-200 hover:text-red-700 flex-shrink-0 ml-2'
                          >
                            <Heart size={20} className='fill-current' />
                          </button>
                        </div>
                        <p className='mb-2 text-sm text-gray-600'>{product.category}</p>
                        <div className='mb-3 flex items-center space-x-4'>
                          <div className='flex items-center space-x-1 text-gray-500'>
                            <Heart size={14} />
                            <span className='text-sm'>{product.likes || 0}</span>
                          </div>
                          <div className='flex items-center space-x-1 text-gray-500'>
                            <Eye size={14} />
                            <span className='text-sm'>{product.views || 0}</span>
                          </div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-lg font-bold text-blue-600'>
                              ₺{product.price?.toFixed(2) || '0.00'}
                            </span>
                            {product.originalPrice && (
                              <span className='text-sm text-gray-500 line-through'>
                                ₺{product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {product.slug && (
                            <Link
                              href={`/urun/${product.slug}`}
                              className='flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700'
                            >
                              <ShoppingBag size={16} />
                              <span>İncele</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='space-y-6'
              >
                <h2 className='text-2xl font-bold text-gray-900'>Profil Ayarları</h2>
                <div className='rounded-2xl bg-white p-6 shadow-lg'>
                  <h3 className='mb-6 text-lg font-semibold text-gray-900'>Hesap</h3>
                  <div className='grid gap-6 md:grid-cols-2'>
                    <div className='md:col-span-2'>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        E-posta
                      </label>
                      <input
                        type='email'
                        value={profile?.email || ''}
                        disabled
                        readOnly
                        className='w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600'
                      />
                    </div>
                  </div>
                </div>
                <div className='rounded-2xl bg-white p-6 shadow-lg'>
                  <h3 className='mb-6 text-lg font-semibold text-gray-900'>Güvenlik</h3>
                  <form
                    className='space-y-4'
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const form = new FormData(formEl);
                      const currentPassword = (form.get('currentPassword') || '').toString();
                      const newPassword = (form.get('newPassword') || '').toString();
                      const confirmPassword = (form.get('confirmPassword') || '').toString();
                      if (!currentPassword || !newPassword || !confirmPassword) return;
                      fetch('/api/user/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
                      })
                        .then(async (r) => {
                          const jr = await r.json().catch(() => ({}));
                          if (jr?.ok) {
                            setPasswordNotice({ type: 'success', message: 'Şifre güncellendi' });
                            formEl.reset();
                          } else {
                            setPasswordNotice({
                              type: 'error',
                              message: jr?.error || 'İşlem başarısız',
                            });
                          }
                          setTimeout(() => setPasswordNotice(null), 3000);
                        })
                        .catch(() => {
                          setPasswordNotice({ type: 'error', message: 'Bağlantı hatası' });
                          setTimeout(() => setPasswordNotice(null), 3000);
                        });
                    }}
                  >
                    {passwordNotice ? (
                      <div
                        role='status'
                        aria-live='polite'
                        className={`rounded-lg px-3 py-2 text-sm ${passwordNotice.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                      >
                        {passwordNotice.message}
                      </div>
                    ) : null}
                    <div>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Mevcut Şifre
                      </label>
                      <input
                        name='currentPassword'
                        type='password'
                        className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      />
                    </div>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                          Yeni Şifre
                        </label>
                        <input
                          name='newPassword'
                          type='password'
                          className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                        />
                      </div>
                      <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                          Şifre Tekrar
                        </label>
                        <input
                          name='confirmPassword'
                          type='password'
                          className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                        />
                      </div>
                    </div>
                    <div className='flex justify-end'>
                      <button
                        type='submit'
                        className='rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700'
                      >
                        Şifreyi Değiştir
                      </button>
                    </div>
                  </form>
                </div>
                {/* E-posta sabit ve değiştirilemez; güncellenecek alan yok */}
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className='space-y-6'
              >
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-gray-900'>Destek Talepleri</h2>
                  <button
                    onClick={() => setShowCreateTicket(true)}
                    className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700'
                  >
                    <Plus size={20} />
                    <span>Yeni Destek Talebi</span>
                  </button>
                </div>
                <div className='grid gap-6 md:grid-cols-3'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className='rounded-2xl bg-white p-6 shadow-lg'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Açık Talepler</p>
                        <p className='text-2xl font-bold text-blue-600'>
                          {tickets.filter((t) => t.status === 'açık').length}
                        </p>
                      </div>
                      <div className='rounded-full bg-blue-100 p-3'>
                        <AlertCircle size={24} className='text-blue-600' />
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className='rounded-2xl bg-white p-6 shadow-lg'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Çözülen Talepler</p>
                        <p className='text-2xl font-bold text-green-600'>
                          {tickets.filter((t) => t.status === 'çözüldü').length}
                        </p>
                      </div>
                      <div className='rounded-full bg-green-100 p-3'>
                        <CheckCircle size={24} className='text-green-600' />
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className='rounded-2xl bg-white p-6 shadow-lg'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Toplam Talep</p>
                        <p className='text-2xl font-bold text-gray-900'>{tickets.length}</p>
                      </div>
                      <div className='rounded-full bg-gray-100 p-3'>
                        <MessageSquare size={24} className='text-gray-600' />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className='rounded-2xl bg-white p-6 shadow-lg'>
                  <div className='space-y-4'>
                    {(isLoadingTickets ? [] : tickets).map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className='cursor-pointer rounded-xl border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-md'
                        onClick={() => {
                          setSelectedTicket(null);
                          fetch(`/api/support-tickets/${ticket.id}`).then(async (r) => {
                            if (!r.ok) return;
                            const d = await r.json();
                            setSelectedTicket(d.ticket);
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
                                Oluşturulma: {new Date(ticket.createdAt).toLocaleString()}
                              </span>
                              <span className='text-xs text-gray-500'>
                                Son Güncelleme: {new Date(ticket.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className='flex items-center space-x-3'>
                            <span
                              className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                            >
                              <span>{ticket.priority}</span>
                            </span>
                            <span
                              className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}
                            >
                              {getStatusIcon(ticket.status)}
                              <span className='capitalize'>{ticket.status}</span>
                            </span>
                            <ArrowRight size={16} className='text-gray-400' />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreateTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            onClick={() => setShowCreateTicket(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4'>
                <h2 className='text-xl font-bold text-gray-900'>Yeni Destek Talebi</h2>
                <button
                  onClick={() => setShowCreateTicket(false)}
                  className='rounded-full p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600'
                >
                  <X size={20} />
                </button>
              </div>
              <div className='p-6'>
                <form
                  className='space-y-6'
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const form = new FormData(formEl);
                    fetch('/api/support-tickets', { method: 'POST', body: form })
                      .then(async (r) => {
                        // Başarısız olsa bile hata göstermeden sessizce devam et
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
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>Konu *</label>
                    <input
                      name='subject'
                      type='text'
                      placeholder='Sorununuzu kısaca özetleyin'
                      className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                    />
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Kategori *
                      </label>
                      <select
                        name='category'
                        className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      >
                        <option value=''>Kategori Seçin</option>
                        <option value='Teknik Destek'>Teknik Destek</option>
                        <option value='Ödeme'>Ödeme</option>
                        <option value='Hesap'>Hesap</option>
                        <option value='Ürün'>Ürün</option>
                        <option value='Genel'>Genel</option>
                      </select>
                    </div>
                    <div>
                      <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Öncelik *
                      </label>
                      <select
                        name='priority'
                        className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      >
                        <option value=''>Öncelik Seçin</option>
                        <option value='Düşük'>Düşük</option>
                        <option value='Orta'>Orta</option>
                        <option value='Yüksek'>Yüksek</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Açıklama *
                    </label>
                    <textarea
                      name='description'
                      rows={6}
                      placeholder='Sorununuzu detaylı olarak açıklayın...'
                      className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Ek Dosya (Opsiyonel)
                    </label>
                    <input
                      type='file'
                      className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                      Maksimum 10MB. JPG, PNG, PDF, ZIP desteklenir.
                    </p>
                  </div>
                  <div className='flex justify-end space-x-4'>
                    <button
                      type='button'
                      onClick={() => setShowCreateTicket(false)}
                      className='rounded-xl border border-gray-300 px-6 py-3 text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                    >
                      İptal
                    </button>
                    <button
                      type='submit'
                      className='flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700'
                    >
                      <Reply size={16} />
                      <span>Talep Gönder</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4'>
                <div>
                  <h2 className='text-xl font-bold text-gray-900'>{selectedTicket.subject}</h2>
                  <p className='text-sm text-gray-600'>#{selectedTicket.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className='rounded-full p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600'
                >
                  <X size={20} />
                </button>
              </div>
              <div className='p-6'>
                <div className='mb-6 flex items-center space-x-4'>
                  <span
                    className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}
                  >
                    <span>{selectedTicket.priority}</span>
                  </span>
                  <span
                    className={`flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedTicket.status)}`}
                  >
                    {getStatusIcon(selectedTicket.status)}
                    <span className='capitalize'>{selectedTicket.status}</span>
                  </span>
                  <span className='text-sm text-gray-500'>{selectedTicket.category}</span>
                </div>
                <div className='space-y-4'>
                  {selectedTicket.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className={`rounded-xl p-4 ${message.sender === 'user' ? 'ml-8 bg-blue-50' : 'mr-8 bg-gray-50'}`}
                    >
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm font-medium text-gray-900'>
                          {message.sender === 'user' ? 'Siz' : 'Destek Ekibi'}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {message.timestamp ||
                            new Date(message.createdAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <p className='text-sm text-gray-700'>{message.message}</p>
                    </motion.div>
                  ))}
                </div>
                {selectedTicket.status !== 'çözüldü' && (
                  <div className='mt-6 border-t border-gray-200 pt-6'>
                    <h3 className='mb-4 text-lg font-semibold text-gray-900'>Yanıt Ekle</h3>
                    <form
                      className='space-y-4'
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formEl = e.currentTarget;
                        const form = new FormData(formEl);
                        const message = form.get('message');
                        if (!message) return;
                        fetch(`/api/support-tickets/${selectedTicket.id}/messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message }),
                        })
                          .then(async (r) => {
                            const jr = await r.json().catch(() => ({}));
                            if (jr?.ok !== true) return; // sessizce başarısız ol
                            const detail = await fetch(`/api/support-tickets/${selectedTicket.id}`);
                            const data = await detail.json().catch(() => ({}));
                            formEl.reset();
                            data?.ticket &&
                              (window?.requestAnimationFrame
                                ? requestAnimationFrame(() => setSelectedTicket(data.ticket))
                                : setSelectedTicket(data.ticket));
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
                          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700'
                        >
                          <Reply size={16} />
                          <span>Yanıt Gönder</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserPanelPage;
