'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Eye, Trash2, Edit2, Power, Download, X, Check, Package, BarChart3, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { TagInput } from '@/components/ui/TagInput';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  
  // Categories
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [stores, setStores] = useState([]);
  
  // Edit form data
  const [editFormData, setEditFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    isFree: false,
    license: '',
    tags: [],
    features: [],
    geometry: '',
    polygons: '',
    vertices: '',
    gameReady: false,
    aiGenerated: false,
    status: 'APPROVED',
    coverImage: '',
    mediaImages: [],
    productFiles: [],
    model3dFile: null,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.ok && data.flat) {
          const parents = data.flat.filter(c => !c.parentId).map(c => ({
            name: c.name,
            slug: c.slug,
          }));
          setCategories(parents);
          
          // Kategori haritası oluştur (alt kategoriler için)
          const map = {};
          data.flat.forEach(cat => {
            if (cat.parentId) {
              const parent = data.flat.find(p => p.id === cat.parentId);
              if (parent) {
                if (!map[parent.name]) map[parent.name] = [];
                map[parent.name].push(cat.name);
              }
            }
          });
          setCategoryMap(map);
        }
      } catch (error) {
        console.error('Categories load error:', error);
      }
    };
    
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, statusFilter, categoryFilter, storeFilter, priceMin, priceMax, sortBy, sortOrder]);

  const loadProducts = async () => {
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
      if (categoryFilter) params.set('category', categoryFilter);
      if (storeFilter) params.set('authorId', storeFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        let filtered = data.products;
        
        // Fiyat filtresi (client-side)
        if (priceMin || priceMax) {
          filtered = filtered.filter(p => {
            const price = Number(p.price) || 0;
            const min = priceMin ? Number(priceMin) : 0;
            const max = priceMax ? Number(priceMax) : Infinity;
            return price >= min && price <= max;
          });
        }
        
        setProducts(filtered);
        setTotal(data.total);
        
        // Store listesini oluştur
        const storeSet = new Set();
        filtered.forEach(p => {
          if (p.author?.id) {
            storeSet.add(JSON.stringify({
              id: p.author.id,
              name: p.author.storeName || `${p.author.firstName} ${p.author.lastName}`,
            }));
          }
        });
        setStores(Array.from(storeSet).map(s => JSON.parse(s)));
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      const data = await res.json();
      if (data.ok && data.item) {
        const item = data.item;
        setEditingProduct(product);
        setEditFormData({
          title: item.title || '',
          slug: item.slug || '',
          description: item.description || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          price: String(item.price || 0),
          isFree: item.isFree || false,
          license: item.license || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          features: Array.isArray(item.features) ? item.features : [],
          geometry: item.geometry || '',
          polygons: String(item.polygons || 0),
          vertices: String(item.vertices || 0),
          gameReady: item.gameReady || false,
          aiGenerated: item.aiGenerated || false,
          status: item.status || 'APPROVED',
          coverImage: item.coverImage || '',
          mediaImages: Array.isArray(item.mediaImages) ? item.mediaImages : [],
          productFiles: Array.isArray(item.productFiles) ? item.productFiles : [],
          model3dFile: item.model3dFile || null,
        });
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Load product error:', error);
      alert('Ürün yüklenemedi');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    
    try {
      const updateData = {
        ...editFormData,
        price: Number(editFormData.price) || 0,
        polygons: Number(editFormData.polygons) || 0,
        vertices: Number(editFormData.vertices) || 0,
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (data.ok || res.ok) {
        alert('Ürün güncellendi!');
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
    const action = newStatus === 'DRAFT' ? 'pasife çekmek' : 'aktifleştirmek';
    
    if (!confirm(`Bu ürünü ${action} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.ok || res.ok) {
        alert(`Ürün ${newStatus === 'DRAFT' ? 'pasife çekildi' : 'aktifleştirildi'}!`);
        loadProducts();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Ürün silindi!');
        loadProducts();
      } else {
        alert(data.error || 'Silme başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleViewDetails = async (product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      const data = await res.json();
      if (data.ok && data.item) {
        setDetailProduct(data.item);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Load product details error:', error);
      alert('Ürün detayları yüklenemedi');
    }
  };

  const handleBulkToggleStatus = async (newStatus) => {
    if (selectedProducts.size === 0) {
      alert('Lütfen en az bir ürün seçin');
      return;
    }

    const action = newStatus === 'DRAFT' ? 'pasife çekmek' : 'aktifleştirmek';
    if (!confirm(`${selectedProducts.size} ürünü ${action} istediğinize emin misiniz?`)) return;

    try {
      const promises = Array.from(selectedProducts).map((id) =>
        fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      );
      await Promise.all(promises);
      alert(`Ürünler ${newStatus === 'DRAFT' ? 'pasife çekildi' : 'aktifleştirildi'}!`);
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('Bulk toggle error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      alert('Lütfen en az bir ürün seçin');
      return;
    }

    if (!confirm(`${selectedProducts.size} ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;

    try {
      const promises = Array.from(selectedProducts).map((id) =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      alert('Ürünler silindi!');
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleExport = () => {
    const csvHeaders = [
      'ID', 'Başlık', 'Kategori', 'Alt Kategori', 'Fiyat', 'Ücretsiz', 'Durum',
      'Görüntülenme', 'İndirme', 'Beğeni', 'Satış', 'Mağaza', 'Oluşturma Tarihi', 'Güncelleme Tarihi'
    ];
    
    const csvRows = products.map(p => [
      p.id,
      p.title,
      p.category,
      p.subcategory || '',
      p.price || 0,
      p.isFree ? 'Evet' : 'Hayır',
      p.status === 'APPROVED' ? 'Aktif' : 'Pasif',
      p.views || 0,
      p.downloads || 0,
      p.likes || 0,
      p._count?.orders || 0,
      p.author?.storeName || `${p.author?.firstName} ${p.author?.lastName}`,
      new Date(p.createdAt).toLocaleString('tr-TR'),
      new Date(p.updatedAt).toLocaleString('tr-TR'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `urunler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleSelect = (productId) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Aktif';
      case 'DRAFT':
        return 'Pasif';
      default:
        return status;
    }
  };

  const subcategoriesForCategory = useMemo(() => {
    return editFormData.category ? (categoryMap[editFormData.category] || []) : [];
  }, [editFormData.category, categoryMap]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Ürün Yönetimi</h1>
          <p className='mt-1 text-gray-600'>Toplam {total} ürün</p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleExport}
            className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            <Download size={18} />
            <span>Export (CSV)</span>
          </button>
          {selectedProducts.size > 0 && (
            <>
              <button
                onClick={() => handleBulkToggleStatus('APPROVED')}
                className='flex items-center space-x-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700'
              >
                <Power size={18} />
                <span>Toplu Aktifleştir ({selectedProducts.size})</span>
              </button>
              <button
                onClick={() => handleBulkToggleStatus('DRAFT')}
                className='flex items-center space-x-2 rounded-xl bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'
              >
                <Power size={18} />
                <span>Toplu Pasife Çek ({selectedProducts.size})</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className='flex items-center space-x-2 rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700'
              >
                <Trash2 size={18} />
                <span>Toplu Sil ({selectedProducts.size})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gelişmiş Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='grid gap-4 md:grid-cols-6'>
          <div className='relative md:col-span-2'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Ara (başlık, kategori, açıklama)'
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
            <option value='APPROVED'>Aktif</option>
            <option value='DRAFT'>Pasif</option>
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
              <option key={cat.slug} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
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
            <option value='views-desc'>En Çok Görüntülenen</option>
            <option value='downloads-desc'>En Çok İndirilen</option>
            <option value='likes-desc'>En Çok Beğenilen</option>
            <option value='price-asc'>Fiyat (Düşük → Yüksek)</option>
            <option value='price-desc'>Fiyat (Yüksek → Düşük)</option>
          </select>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm text-gray-700'>Min Fiyat (₺)</label>
            <input
              type='number'
              value={priceMin}
              onChange={(e) => {
                setPriceMin(e.target.value);
                setPage(1);
              }}
              placeholder='0'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm text-gray-700'>Max Fiyat (₺)</label>
            <input
              type='number'
              value={priceMax}
              onChange={(e) => {
                setPriceMax(e.target.value);
                setPage(1);
              }}
              placeholder='Sınırsız'
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
        </div>
      </div>

      {/* Ürün Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left'>
                      <input
                        type='checkbox'
                        checked={selectedProducts.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Ürün</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Kategori</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Fiyat</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>İstatistikler</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Mağaza</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Durum</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tarih</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <input
                          type='checkbox'
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='h-20 w-20 overflow-hidden rounded-lg bg-gray-200'>
                            <img
                              src={product.coverImage || '/logo.svg'}
                              alt={product.title}
                              className='h-full w-full object-cover'
                              onError={(e) => (e.currentTarget.src = '/logo.svg')}
                            />
                          </div>
                          <div className='max-w-xs'>
                            <p className='font-semibold text-gray-900 line-clamp-2'>{product.title}</p>
                            <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{product.description}</p>
                            {product.tags && product.tags.length > 0 && (
                              <div className='mt-2 flex flex-wrap gap-1'>
                                {product.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className='rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600'>
                                    {tag}
                                  </span>
                                ))}
                                {product.tags.length > 3 && (
                                  <span className='text-xs text-gray-400'>+{product.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>{product.category}</p>
                          {product.subcategory && (
                            <p className='text-xs text-gray-500'>{product.subcategory}</p>
                          )}
                          {product.license && (
                            <p className='text-xs text-gray-400 mt-1'>📄 {product.license}</p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        {product.isFree ? (
                          <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'>
                            Ücretsiz
                          </span>
                        ) : (
                          <span className='font-semibold text-gray-900'>₺{Number(product.price || 0).toFixed(2)}</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div className='space-y-1'>
                          <div className='flex items-center space-x-1'>
                            <Eye size={14} />
                            <span className='font-medium'>{product.views || 0}</span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Download size={14} />
                            <span className='font-medium'>{product.downloads || 0}</span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Package size={14} />
                            <span className='font-medium'>{product._count?.orders || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <p className='text-sm text-gray-900'>
                          {product.author?.storeName || `${product.author?.firstName} ${product.author?.lastName}`}
                        </p>
                        <p className='text-xs text-gray-500'>{product.author?.email}</p>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            product.status
                          )}`}
                        >
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div>
                          <p>{new Date(product.createdAt).toLocaleDateString('tr-TR')}</p>
                          <p className='text-xs text-gray-400'>{new Date(product.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                          {product.updatedAt && product.updatedAt !== product.createdAt && (
                            <p className='text-xs text-gray-400 mt-1'>Güncellendi: {new Date(product.updatedAt).toLocaleDateString('tr-TR')}</p>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleViewDetails(product)}
                            className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                            title='Detaylar'
                          >
                            <BarChart3 size={18} />
                          </button>
                          <Link
                            href={`/urun/${product.slug || product.id}`}
                            target='_blank'
                            className='rounded-lg p-2 text-gray-600 hover:bg-gray-50'
                            title='Görüntüle'
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleEdit(product)}
                            className='rounded-lg p-2 text-indigo-600 hover:bg-indigo-50'
                            title='Düzenle'
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`rounded-lg p-2 ${
                              product.status === 'APPROVED'
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={product.status === 'APPROVED' ? 'Pasife Çek' : 'Aktifleştir'}
                          >
                            <Power size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className='rounded-lg p-2 text-red-600 hover:bg-red-50'
                            title='Sil'
                          >
                            <Trash2 size={18} />
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
          <div className='p-12 text-center text-gray-500'>Ürün bulunamadı</div>
        )}
      </div>

      {/* Düzenleme Modalı */}
      {showEditModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto'
          onClick={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
        >
          <div
            className='w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Ürün Düzenle</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Temel Bilgiler */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Başlık *</label>
                  <input
                    type='text'
                    value={editFormData.title}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Slug *</label>
                  <input
                    type='text'
                    value={editFormData.slug}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Açıklama *</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>

              {/* Kategori */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Kategori *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, category: e.target.value, subcategory: '' }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  >
                    <option value=''>Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Alt Kategori</label>
                  <select
                    value={editFormData.subcategory}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
                    disabled={!editFormData.category}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100'
                  >
                    <option value=''>Seçin</option>
                    {subcategoriesForCategory.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fiyat */}
              <div className='grid gap-4 md:grid-cols-3'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Fiyat (₺) *</label>
                  <input
                    type='number'
                    value={editFormData.price}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, price: e.target.value }))}
                    disabled={editFormData.isFree}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100'
                  />
                </div>
                <div className='flex items-end'>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={editFormData.isFree}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, isFree: e.target.checked }))}
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='text-sm font-medium text-gray-700'>Ücretsiz</span>
                  </label>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Lisans</label>
                  <select
                    value={editFormData.license}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, license: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  >
                    <option value=''>Seçin</option>
                    <option value='Standard'>Standard</option>
                    <option value='Extended'>Extended</option>
                    <option value='Editorial'>Editorial</option>
                  </select>
                </div>
              </div>

              {/* Etiketler */}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Etiketler</label>
                <TagInput
                  values={editFormData.tags}
                  onChange={(tags) => setEditFormData((prev) => ({ ...prev, tags }))}
                  variant='primary'
                  max={10}
                />
              </div>

              {/* Özellikler */}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Özellikler</label>
                <TagInput
                  values={editFormData.features}
                  onChange={(features) => setEditFormData((prev) => ({ ...prev, features }))}
                  variant='primary'
                  max={15}
                  placeholder='Özellik ekle...'
                />
              </div>

              {/* Teknik Detaylar */}
              <div className='grid gap-4 md:grid-cols-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Geometry</label>
                  <select
                    value={editFormData.geometry}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, geometry: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  >
                    <option value=''>Seçin</option>
                    <option value='Low Poly'>Low Poly</option>
                    <option value='High Poly'>High Poly</option>
                    <option value='Mixed'>Mixed</option>
                  </select>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Polygons</label>
                  <input
                    type='number'
                    value={editFormData.polygons}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, polygons: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Vertices</label>
                  <input
                    type='number'
                    value={editFormData.vertices}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, vertices: e.target.value }))}
                    className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                </div>
                <div className='flex items-end space-x-4'>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={editFormData.gameReady}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, gameReady: e.target.checked }))}
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='text-sm font-medium text-gray-700'>Game Ready</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={editFormData.aiGenerated}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, aiGenerated: e.target.checked }))}
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='text-sm font-medium text-gray-700'>AI Generated</span>
                  </label>
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Durum</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                >
                  <option value='APPROVED'>Aktif</option>
                  <option value='DRAFT'>Pasif</option>
                </select>
              </div>

              {/* Kapak Görseli */}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Kapak Görseli URL</label>
                <input
                  type='text'
                  value={editFormData.coverImage}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder='https://...'
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
                {editFormData.coverImage && (
                  <img src={editFormData.coverImage} alt='Preview' className='mt-2 h-32 w-32 rounded-lg object-cover' />
                )}
              </div>

              {/* Butonlar */}
              <div className='flex space-x-3 pt-4'>
                <button
                  onClick={handleSaveEdit}
                  className='flex-1 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700'
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className='flex-1 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modalı */}
      {showDetailModal && detailProduct && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => {
            setShowDetailModal(false);
            setDetailProduct(null);
          }}
        >
          <div
            className='w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>Ürün Detayları</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailProduct(null);
                }}
                className='rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <img
                    src={detailProduct.coverImage || '/logo.svg'}
                    alt={detailProduct.title}
                    className='h-48 w-full rounded-lg object-cover'
                  />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>{detailProduct.title}</h3>
                  <p className='mt-2 text-gray-600'>{detailProduct.description}</p>
                  <div className='mt-4 space-y-2'>
                    <p className='text-sm text-gray-700'>
                      <span className='font-medium'>Kategori:</span> {detailProduct.category}
                      {detailProduct.subcategory && ` / ${detailProduct.subcategory}`}
                    </p>
                    <p className='text-sm text-gray-700'>
                      <span className='font-medium'>Fiyat:</span>{' '}
                      {detailProduct.isFree ? (
                        <span className='text-green-600'>Ücretsiz</span>
                      ) : (
                        `₺${Number(detailProduct.price || 0).toFixed(2)}`
                      )}
                    </p>
                    <p className='text-sm text-gray-700'>
                      <span className='font-medium'>Durum:</span>{' '}
                      <span className={detailProduct.status === 'APPROVED' ? 'text-green-600' : 'text-gray-600'}>
                        {detailProduct.status === 'APPROVED' ? 'Aktif' : 'Pasif'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-4 rounded-xl bg-gray-50 p-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-gray-900'>{detailProduct.views || 0}</p>
                  <p className='text-sm text-gray-600'>Görüntülenme</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-gray-900'>{detailProduct.downloads || 0}</p>
                  <p className='text-sm text-gray-600'>İndirme</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-gray-900'>{detailProduct.likes || 0}</p>
                  <p className='text-sm text-gray-600'>Beğeni</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-gray-900'>{detailProduct._count?.orders || 0}</p>
                  <p className='text-sm text-gray-600'>Satış</p>
                </div>
              </div>

              {detailProduct.tags && detailProduct.tags.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-700'>Etiketler</h4>
                  <div className='flex flex-wrap gap-2'>
                    {detailProduct.tags.map((tag, idx) => (
                      <span key={idx} className='rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600'>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detailProduct.features && detailProduct.features.length > 0 && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-700'>Özellikler</h4>
                  <ul className='list-disc list-inside space-y-1 text-sm text-gray-600'>
                    {detailProduct.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-700'>Teknik Detaylar</h4>
                  <div className='space-y-1 text-sm text-gray-600'>
                    {detailProduct.geometry && <p>Geometry: {detailProduct.geometry}</p>}
                    {detailProduct.polygons > 0 && <p>Polygons: {detailProduct.polygons.toLocaleString()}</p>}
                    {detailProduct.vertices > 0 && <p>Vertices: {detailProduct.vertices.toLocaleString()}</p>}
                    {detailProduct.gameReady && <p className='text-purple-600'>🎮 Game Ready</p>}
                    {detailProduct.aiGenerated && <p className='text-indigo-600'>🤖 AI Generated</p>}
                  </div>
                </div>
                <div>
                  <h4 className='mb-2 text-sm font-medium text-gray-700'>Tarihler</h4>
                  <div className='space-y-1 text-sm text-gray-600'>
                    <p>Oluşturulma: {new Date(detailProduct.createdAt).toLocaleString('tr-TR')}</p>
                    <p>Güncelleme: {new Date(detailProduct.updatedAt).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
