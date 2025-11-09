'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addToCart, openCart } from '@/store/cartSlice';
import { Eye, ShoppingCart, X, ExternalLink, Download, User, Heart, Check, Image, Box } from 'lucide-react';
import ModelViewer from '@/components/ModelViewer';

const Products = () => {
  const dispatch = useDispatch();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);
  const [favoritedProducts, setFavoritedProducts] = useState(new Set());
  const [purchasedProducts, setPurchasedProducts] = useState(new Set());
  const [productViewMode, setProductViewMode] = useState({}); // productId -> 'model' | 'image'

  const openModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleToggleFavorite = async (product, e) => {
    e.stopPropagation();
    const productId = product.id;
    const isCurrentlyFavorited = favoritedProducts.has(productId);
    const newFavoriteState = !isCurrentlyFavorited;

    // Optimistic update
    setFavoritedProducts((prev) => {
      const newSet = new Set(prev);
      if (newFavoriteState) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });

    // Yeni favori API'sini kullan
    try {
      const res = await fetch(`/api/user/favorites/${product.slug || product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok && data.likes !== undefined) {
        // Ürün listesindeki like sayısını güncelle
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === productId ? { ...item, likes: data.likes } : item
          )
        );
        // Modal'daki ürünün like sayısını da güncelle
        if (selectedProduct?.id === productId) {
          setSelectedProduct((prev) => prev ? { ...prev, likes: data.likes } : null);
        }
        // Favori durumunu güncelle
        if (data.isFavorite !== undefined) {
          setFavoritedProducts((prev) => {
            const newSet = new Set(prev);
            if (data.isFavorite) {
              newSet.add(productId);
            } else {
              newSet.delete(productId);
            }
            return newSet;
          });
        }
      } else {
        // Hata durumunda geri al
        throw new Error(data.error || 'Favori işlemi başarısız');
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      // Hata durumunda geri al
      setFavoritedProducts((prev) => {
        const newSet = new Set(prev);
        if (newFavoriteState) {
          newSet.delete(productId);
        } else {
          newSet.add(productId);
        }
        return newSet;
      });
    }
  };

  const products = [
    {
      id: 1,
      slug: 'military-rifle-4-extra-pbr-texture',
      title: 'Military Rifle 4 Extra PBR Texture',
      category: 'Teçhizat & Askeriye',
      image: '/images/products/urun1.svg',
      views: 106,
      likes: 24,
      rating: 4.8,
      formats: ['Blender', 'FBX', 'x3d'],
      author: {
        name: 'John Designer',
        avatar: '/images/avatars/author1.jpg',
      },
      price: '$29.99',
      originalPrice: '$39.99',
      isNew: true,
    },
    {
      id: 2,
      slug: 'modern-architecture-building',
      title: 'Modern Architecture Building',
      category: 'Yapıt',
      image: '/images/products/urun2.svg',
      views: 89,
      likes: 18,
      rating: 4.6,
      formats: ['3ds Max', 'OBJ', 'FBX'],
      author: {
        name: 'Sarah Architect',
        avatar: '/images/avatars/author2.jpg',
      },
      price: '$45.00',
      originalPrice: null,
      isNew: false,
    },
    {
      id: 3,
      slug: 'wildlife-animal-pack',
      title: 'Wildlife Animal Pack',
      category: 'Hayvanlar',
      image: '/images/products/urun3.svg',
      views: 156,
      likes: 32,
      rating: 4.9,
      formats: ['Maya', 'Blender', 'FBX'],
      author: {
        name: 'Mike Animator',
        avatar: '/images/avatars/author3.jpg',
      },
      price: '$39.99',
      originalPrice: '$49.99',
      isNew: true,
    },
    {
      id: 4,
      slug: 'sports-car-collection',
      title: 'Sports Car Collection',
      category: 'Araç',
      image: '/images/products/urun4.svg',
      views: 203,
      likes: 45,
      rating: 4.7,
      formats: ['Blender', 'OBJ', 'FBX'],
      author: {
        name: 'Alex Modeler',
        avatar: '/images/avatars/author4.jpg',
      },
      price: '$59.99',
      originalPrice: null,
      isNew: false,
    },
    {
      id: 5,
      slug: 'fantasy-character-set',
      title: 'Fantasy Character Set',
      category: 'Karakter',
      image: '/images/products/urun5.svg',
      views: 178,
      likes: 28,
      rating: 4.5,
      formats: ['Blender', 'FBX', 'x3d'],
      author: {
        name: 'Emma Artist',
        avatar: '/images/avatars/author5.jpg',
      },
      price: '$49.99',
      originalPrice: '$69.99',
      isNew: true,
    },
    {
      id: 6,
      slug: 'nature-environment-pack',
      title: 'Nature Environment Pack',
      category: 'Doğa',
      image: '/images/products/urun6.svg',
      views: 134,
      likes: 21,
      rating: 4.4,
      formats: ['Unreal', 'Unity', 'FBX'],
      author: {
        name: 'Tom Environment',
        avatar: '/images/avatars/author6.jpg',
      },
      price: '$34.99',
      originalPrice: null,
      isNew: false,
    },
  ];

  const categories = useMemo(
    () => [
      'Teçhizat & Askeriye',
      'Yapıt',
      'Hayvanlar',
      'Araç',
      'Karakter',
      'Doğa',
      'Eşya',
      'Diğer',
    ],
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    setIsLoading(true);
    fetch(`/api/products?${params.toString()}`, { signal: ctrl.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (data?.ok && Array.isArray(data.items)) {
          setItems(data.items);
          setTotal(data.total || 0);
          
          // Satın alınan ürünleri kontrol et
          const purchasedSet = new Set();
          const favoriteSet = new Set();
          const checkPromises = data.items.map(async (item) => {
            try {
              // Satın alma durumunu kontrol et
              const purchasedRes = await fetch(`/api/products/${item.slug || item.id}/purchased`);
              const purchasedData = await purchasedRes.json().catch(() => ({ purchased: false }));
              if (purchasedData.purchased) {
                purchasedSet.add(item.id);
              }

              // Favori durumunu kontrol et
              const favoriteRes = await fetch(`/api/user/favorites/${item.slug || item.id}`);
              const favoriteData = await favoriteRes.json().catch(() => ({ isFavorite: false }));
              if (favoriteData.isFavorite) {
                favoriteSet.add(item.id);
              }
            } catch (err) {
              // Sessiz hata - satın alınmamış/favori değil olarak devam et
            }
          });
          await Promise.all(checkPromises);
          setPurchasedProducts(purchasedSet);
          setFavoritedProducts(favoriteSet);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setIsLoading(false));
    return () => ctrl.abort();
  }, [q, category, sort, page, pageSize]);

  return (
    <section className='bg-white py-20'>
      <div className='container mx-auto max-w-screen-2xl px-4'>
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className='mb-8'
        >
          <div className='mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h2 className='text-3xl font-bold text-gray-900'>Tüm Ürünler</h2>
              <p className='text-sm text-gray-600'>Filtreleyin, sıralayın ve keşfedin</p>
            </div>
            <div className='grid w-full grid-cols-1 gap-3 md:w-auto md:grid-cols-3'>
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder='Ara...'
                className='rounded-xl border border-gray-300 px-3 py-2'
              />
              <select
                value={category}
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value);
                }}
                className='rounded-xl border border-gray-300 px-3 py-2'
              >
                <option value=''>Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                className='rounded-xl border border-gray-300 px-3 py-2'
              >
                <option value='newest'>En yeni</option>
                <option value='views'>En çok görüntülenen</option>
                <option value='downloads'>En çok indirilen</option>
                <option value='price_asc'>Fiyat (Artan)</option>
                <option value='price_desc'>Fiyat (Azalan)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className='mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'
        >
          {[].concat(items || []).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: 'easeOut',
              }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.02,
                y: -5,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal(product)}
              className='group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300'
            >
              {/* Product Image or 3D Model */}
              <div className='relative h-64 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200'>
                {(() => {
                  // model3dFile'ı parse et
                  let modelUrl = null;
                  
                  if (product.model3dFile) {
                    if (typeof product.model3dFile === 'string') {
                      try {
                        const parsed = JSON.parse(product.model3dFile);
                        modelUrl = parsed?.url || parsed;
                      } catch {
                        modelUrl = product.model3dFile;
                      }
                    } else if (typeof product.model3dFile === 'object') {
                      modelUrl = product.model3dFile?.url || product.model3dFile;
                    }
                  }
                  
                  const hasModel = modelUrl && String(modelUrl).trim() !== '' && 
                    (String(modelUrl).includes('.gltf') || String(modelUrl).includes('.glb') || 
                     String(modelUrl).includes('.fbx') || String(modelUrl).includes('.obj'));
                  
                  // View mode: 'model' veya 'image' (default: hasModel varsa 'model', yoksa 'image')
                  const viewMode = productViewMode[product.id] || (hasModel ? 'model' : 'image');
                  const showModel = hasModel && viewMode === 'model';
                  
                  return (
                    <>
                      {showModel ? (
                        <div className='h-full w-full relative'>
                          <ModelViewer
                            key={`model-viewer-${product.id}-${String(modelUrl).trim()}`}
                            modelUrl={String(modelUrl).trim()}
                            className='h-full'
                            autoRotate={true}
                            showControls={false}
                          />
                          {/* Switch to Image Button */}
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductViewMode(prev => ({ ...prev, [product.id]: 'image' }));
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className='absolute top-3 left-3 z-10 flex items-center space-x-1 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 text-xs font-medium text-gray-700 shadow-lg transition-all duration-200 hover:bg-white'
                            title='Resme Geç'
                          >
                            <Image size={14} />
                            <span>Resim</span>
                          </motion.button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={product.coverImage || '/logo.svg'}
                            alt={product.title}
                            className='h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110'
                            onError={(e) => (e.currentTarget.src = '/logo.svg')}
                          />
                          <div className='absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent' />
                          {/* Switch to 3D Model Button */}
                          {hasModel && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductViewMode(prev => ({ ...prev, [product.id]: 'model' }));
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className='absolute top-3 left-3 z-10 flex items-center space-x-1 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 text-xs font-medium text-gray-700 shadow-lg transition-all duration-200 hover:bg-white'
                              title='3D Modele Geç'
                            >
                              <Box size={14} />
                              <span>3D Model</span>
                            </motion.button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}

                {/* Favorite Button */}
                <motion.button
                  onClick={(e) => handleToggleFavorite(product, e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className='absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 shadow-lg transition-all duration-200 hover:bg-white hover:text-red-500'
                >
                  <Heart
                    size={20}
                    className={favoritedProducts.has(product.id) ? 'fill-current text-red-500' : ''}
                  />
                </motion.button>

                {/* Price badge removed; fiyat aşağıda */}

                {/* Hover Overlay */}
                {!purchasedProducts.has(product.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className='absolute inset-0 flex items-center justify-center bg-black/60'
                  >
                    {Number(product.price ?? 0) <= 0 ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`/api/products/${product.slug || product.id}/download`, {
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
                              // Kütüphaneye eklendi - state'i güncelle
                              setPurchasedProducts((prev) => new Set([...prev, product.id]));
                              // Ürün listesini de güncelle
                              setItems((prevItems) =>
                                prevItems.map((item) =>
                                  item.id === product.id
                                    ? { ...item, downloads: (item.downloads || 0) + 1 }
                                    : item
                                )
                              );
                            } else {
                              alert(data.error || 'İndirme hatası');
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            alert('İndirme işlemi başarısız');
                          }
                        }}
                        className='flex items-center space-x-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800'
                      >
                        <Download size={18} />
                        <span className='font-semibold'>Ücretsiz İndir</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const productForCart = {
                            ...product,
                            price: String(product.price ?? 0),
                            coverImage: product.coverImage || product.image || '/logo.svg',
                          };
                          dispatch(addToCart({ product: productForCart }));
                          dispatch(openCart());
                        }}
                        className='flex items-center space-x-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-blue-800'
                      >
                        <ShoppingCart size={18} />
                        <span className='font-semibold'>Satın Al</span>
                      </motion.button>
                    )}
                  </motion.div>
                )}
                {purchasedProducts.has(product.id) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className='absolute inset-0 flex items-center justify-center bg-black/60'
                  >
                    <motion.div className='flex items-center space-x-2 rounded-xl bg-gray-500 px-6 py-3 text-white shadow-xl'>
                      <Check size={18} />
                      <span className='font-semibold'>Satın Alındı</span>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Product Info */}
              <div className='p-6'>
                {/* Category */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                  className='mb-3'
                >
                  <span className='inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600'>
                    {product.category}
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                  className='mb-4 line-clamp-2 text-lg leading-tight font-bold text-gray-900'
                >
                  {product.title}
                </motion.h3>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + index * 0.1, duration: 0.3 }}
                  className='mb-4 flex items-center justify-start space-x-6 text-sm text-gray-500'
                >
                  <div className='flex items-center space-x-1'>
                    <Eye size={16} />
                    <span className='font-medium'>{product.views ?? 0}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Download size={16} />
                    <span className='font-medium'>{product.downloads ?? 0}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Heart size={16} className={favoritedProducts.has(product.id) ? 'fill-current text-red-500' : ''} />
                    <span className='font-medium'>{product.likes ?? 0}</span>
                  </div>
                </motion.div>

                {/* Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.3 }}
                  className='mb-4 flex flex-wrap gap-2'
                >
                  {(product.tags || []).slice(0, 6).map((t, i) => (
                    <span
                      key={i}
                      className='rounded-lg bg-linear-to-r from-gray-100 to-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm'
                    >
                      {t}
                    </span>
                  ))}
                </motion.div>

                {/* Seller */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
                      <User size={16} />
                    </div>
                    <span className='text-sm font-semibold text-gray-700'>
                      {product.author?.storeName ||
                        `${product.author?.firstName ?? ''} ${product.author?.lastName ?? ''}`.trim() ||
                        'Satıcı'}
                    </span>
                  </div>

                  {/* Price in footer */}
                  <div className='text-right'>
                    {Number(product.price ?? 0) <= 0 ? (
                      <span className='rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200'>
                        Ücretsiz
                      </span>
                    ) : (
                      <div className='text-lg font-bold text-gray-900'>₺{product.price}</div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Product Preview Modal */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className='relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl'
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className='absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-gray-900'
              >
                <X size={20} />
              </button>

              <div className='flex flex-col lg:flex-row'>
                {/* Product Image */}
                <div className='relative h-64 bg-linear-to-br from-gray-100 to-gray-200 lg:h-auto lg:flex-1'>
                  <img
                    src={selectedProduct?.coverImage || '/logo.svg'}
                    alt={selectedProduct.title}
                    className='h-full w-full object-contain object-center'
                    onError={(e) => (e.currentTarget.src = '/logo.svg')}
                  />
                  <div className='absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent' />

                  {/* Price badge removed; fiyat sağ tarafta */}
                </div>

                {/* Product Details */}
                <div className='flex-1 p-8'>
                  {/* Category */}
                  <div className='mb-4'>
                    <span className='inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600'>
                      {selectedProduct.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className='mb-4 text-2xl font-bold text-gray-900 lg:text-3xl'>
                    {selectedProduct.title}
                  </h2>

                  {/* Meta */}
                  <div className='mb-6 flex items-center space-x-8 text-sm text-gray-500'>
                    <div className='flex items-center space-x-2'>
                      <Eye size={18} />
                      <span className='font-medium'>{selectedProduct.views ?? 0} görüntülenme</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Download size={18} />
                      <span className='font-medium'>{selectedProduct.downloads ?? 0} indirme</span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description ? (
                    <div className='mb-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-700'>
                      {selectedProduct.description}
                    </div>
                  ) : null}

                  {/* Formats */}
                  <div className='mb-6'>
                    <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                      Desteklenen Formatlar
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {(selectedProduct.tags || []).slice(0, 6).map((t, i) => (
                        <span
                          key={i}
                          className='rounded-lg bg-linear-to-r from-gray-100 to-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm'
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Seller */}
                  <div className='mb-8 flex items-center space-x-4'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
                      <User size={20} />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Satıcı</p>
                      <p className='font-semibold text-gray-900'>
                        {selectedProduct.author?.storeName ||
                          `${selectedProduct.author?.firstName ?? ''} ${selectedProduct.author?.lastName ?? ''}`.trim() ||
                          'Satıcı'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex flex-col space-y-3'>
                    {/* Favorilere Ekle ve Ürüne Git yan yana */}
                    <div className='flex space-x-4'>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(selectedProduct, e);
                        }}
                        className={`flex flex-1 items-center justify-center space-x-2 rounded-xl border-2 px-6 py-4 font-semibold shadow-lg transition-all duration-300 ${
                          favoritedProducts.has(selectedProduct.id)
                            ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Heart
                          size={20}
                          className={favoritedProducts.has(selectedProduct.id) ? 'fill-current' : ''}
                        />
                        <span>
                          {favoritedProducts.has(selectedProduct.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                        </span>
                      </motion.button>

                      <Link href={`/urun/${selectedProduct.slug || selectedProduct.id}`} className='flex-1'>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-4 font-semibold text-blue-600 transition-all duration-300 hover:bg-blue-50'
                        >
                          <ExternalLink size={20} />
                          <span>Ürüne Git</span>
                        </motion.button>
                      </Link>
                    </div>

                    {/* Satın Al butonu tam genişlikte */}
                    {purchasedProducts.has(selectedProduct?.id) ? (
                      <motion.button
                        disabled
                        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-gray-400 px-6 py-4 font-semibold text-white shadow-lg cursor-not-allowed'
                      >
                        <Check size={20} />
                        <span>Zaten Satın Alındı</span>
                      </motion.button>
                    ) : Number(selectedProduct.price ?? 0) <= 0 ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/products/${selectedProduct.slug || selectedProduct.id}/download`, {
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
                              // Kütüphaneye eklendi - state'i güncelle
                              setPurchasedProducts((prev) => new Set([...prev, selectedProduct.id]));
                              // Ürün listesini de güncelle
                              setItems((prevItems) =>
                                prevItems.map((item) =>
                                  item.id === selectedProduct.id
                                    ? { ...item, downloads: (item.downloads || 0) + 1 }
                                    : item
                                )
                              );
                              // Modal'daki ürünü de güncelle
                              setSelectedProduct((prev) =>
                                prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null
                              );
                              closeModal();
                            } else {
                              alert(data.error || 'İndirme hatası');
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            alert('İndirme işlemi başarısız');
                          }
                        }}
                        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800'
                      >
                        <Download size={20} />
                        <span>Ücretsiz İndir</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const productForCart = {
                            ...selectedProduct,
                            price: String(selectedProduct.price ?? 0),
                            coverImage: selectedProduct.coverImage || selectedProduct.image || '/logo.svg',
                          };
                          dispatch(addToCart({ product: productForCart }));
                          dispatch(openCart());
                          closeModal();
                        }}
                        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800'
                      >
                        <ShoppingCart size={20} />
                        <span>Satın Al - ₺{selectedProduct.price}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Products;
