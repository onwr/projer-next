'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addToCart, openCart } from '@/store/cartSlice';
import Link from 'next/link';
import {
  Eye,
  Heart,
  ShoppingCart,
  Download,
  Share2,
  Grid3X3,
  Check,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ModelViewer from '@/components/ModelViewer';

const ProductDetail = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('images');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const viewsIncremented = useRef(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        
        if (!data.ok || !data.item) {
          setError('Ürün bulunamadı');
          return;
        }

        setProduct(data.item);
        
        // Satın alma durumunu kontrol et
        const purchasedRes = await fetch(`/api/products/${slug}/purchased`);
        const purchasedData = await purchasedRes.json().catch(() => ({ purchased: false }));
        setIsPurchased(purchasedData.purchased || false);
        
        // Favori durumunu kontrol et
        const favoriteRes = await fetch(`/api/user/favorites/${slug}`);
        const favoriteData = await favoriteRes.json().catch(() => ({ isFavorite: false }));
        setIsFavorite(favoriteData.isFavorite || false);
        
        // Görüntülenme sayacını artır (sadece bir kez)
        if (!viewsIncremented.current) {
          viewsIncremented.current = true;
          fetch(`/api/products/${slug}/increment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: 'views' }),
          }).then((res) => res.json()).then((result) => {
            if (result.ok && result.views !== undefined) {
              setProduct((prev) => prev ? { ...prev, views: result.views } : null);
            }
          }).catch(console.error);
        }
        
        // Aynı kategorideki ürünleri çek
        if (data.item.category) {
          const relatedRes = await fetch(`/api/products?category=${encodeURIComponent(data.item.category)}&pageSize=3`);
          const relatedData = await relatedRes.json();
          if (relatedData.ok && relatedData.items) {
            setRelatedProducts(
              relatedData.items.filter((p) => p.id !== data.item.id).slice(0, 3)
            );
          }
        }
      } catch (err) {
        setError('Ürün yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Mevcut kullanıcı bilgisini çek
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) {
          setCurrentUserId(null);
          return;
        }
        const data = await res.json();
        if (data?.user?.id) {
          setCurrentUserId(data.user.id);
        }
      } catch (_) {
        // Kullanıcı giriş yapmamış veya hata var
        setCurrentUserId(null);
      }
    };
    fetchCurrentUser();
  }, []);

  // Ürünün sahibi mi kontrol et
  const isOwner = currentUserId && product?.authorId && currentUserId === product.authorId;

  const handleAddToCart = () => {
    if (!product) return;
    const productForCart = {
      ...product,
      price: String(product.price ?? 0),
      coverImage: product.coverImage || product.image || '/logo.svg',
    };
    dispatch(addToCart({ product: productForCart }));
    dispatch(openCart());
  };

  const handleBuyNow = () => {
    if (!product) return;
    const productIsFree = Number(product.price ?? 0) <= 0;
    if (productIsFree) {
      handleDownload();
    } else {
      handleAddToCart();
    }
  };

  const handleDownload = async () => {
    if (!product) return;
    
    // Downloads sayacını artır
    try {
      const res = await fetch(`/api/products/${slug}/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'downloads' }),
      });
      const data = await res.json();
      if (data.ok && data.downloads !== undefined) {
        setProduct((prev) => prev ? { ...prev, downloads: data.downloads } : null);
      }
    } catch (err) {
      console.error('Download increment error:', err);
    }

    // Dosyaları indir
    if (product.productFiles && product.productFiles.length > 0) {
      product.productFiles.forEach((file) => {
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
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Yeni favori API'sini kullan
    try {
      const res = await fetch(`/api/user/favorites/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok && data.likes !== undefined) {
        setProduct((prev) => prev ? { ...prev, likes: data.likes } : null);
        setIsFavorite(data.isFavorite || false);
      } else {
        // Hata durumunda geri al
        setIsFavorite(!newFavoriteState);
        throw new Error(data.error || 'Favori işlemi başarısız');
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      // Hata durumunda geri al
      setIsFavorite(!newFavoriteState);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        // Share cancelled veya error
      }
    } else {
      // Fallback: URL'yi kopyala
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-4 text-2xl font-semibold text-gray-600'>Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-4 text-2xl font-semibold text-gray-900'>{error || 'Ürün bulunamadı'}</div>
          <Link
            href='/'
            className='text-blue-600 hover:text-blue-700 hover:underline'
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // MediaImages array'ini doğru parse et
  const mediaImageUrls = Array.isArray(product.mediaImages)
    ? product.mediaImages
        .map((m) => (typeof m === 'object' && m?.url ? m.url : typeof m === 'string' ? m : null))
        .filter(Boolean)
    : [];

  const images =
    product.coverImage || mediaImageUrls.length > 0
      ? [product.coverImage, ...mediaImageUrls].filter(Boolean)
      : [];

  const hasImages = images.length > 0;
  const isFree = Number(product.price ?? 0) <= 0;

  // Slider navigation
  const handlePreviousImage = () => {
    setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <div className='grid gap-8 lg:grid-cols-2'>
          {/* Product Media */}
          <div className='space-y-4'>
            {/* Tab Navigation */}
            {product.model3dFile ? (
              <div className='flex rounded-xl bg-gray-100 p-1'>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'images'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className='flex items-center justify-center space-x-2'>
                    <Eye size={16} />
                    <span>Resimler</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('3d')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === '3d'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className='flex items-center justify-center space-x-2'>
                    <Grid3X3 size={16} />
                    <span>3D Model</span>
                  </div>
                </button>
              </div>
            ) : null}

            {/* Content Based on Active Tab */}
            {activeTab === 'images' ? (
              <>
                {/* Main Image */}
                {hasImages ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className='relative aspect-square overflow-hidden rounded-2xl bg-linear-to-br from-gray-100 to-gray-200'
                  >
                    <img
                      src={images[selectedImage] || '/logo.svg'}
                      alt={product.title}
                      className='h-full w-full object-contain object-center'
                      onError={(e) => (e.currentTarget.src = '/logo.svg')}
                    />

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousImage}
                          className='absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110'
                          aria-label='Önceki resim'
                        >
                          <ChevronLeft size={20} className='text-gray-800' />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className='absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110'
                          aria-label='Sonraki resim'
                        >
                          <ChevronRight size={20} className='text-gray-800' />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm'>
                        {selectedImage + 1} / {images.length}
                      </div>
                    )}

                    {/* Image Controls */}
                    <div className='absolute top-4 right-4 flex space-x-2'>
                      <button
                        onClick={handleShare}
                        className='rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white'
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className='relative aspect-square overflow-hidden rounded-2xl bg-linear-to-br from-gray-100 to-gray-200'
                  >
                    <img
                      src='/logo.svg'
                      alt={product.title}
                      className='h-full w-full object-contain object-center opacity-50'
                    />
                  </motion.div>
                )}

                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className='grid grid-cols-4 gap-3'>
                    {images.map((image, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square overflow-hidden rounded-xl transition-all duration-200 ${
                          selectedImage === index
                            ? 'ring-2 ring-blue-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                      >
                        <img
                          src={image || '/logo.svg'}
                          alt={`${product.title} ${index + 1}`}
                          className='h-full w-full object-cover object-center'
                          onError={(e) => (e.currentTarget.src = '/logo.svg')}
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* 3D Model Viewer */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <ModelViewer
                  modelUrl={
                    product.model3dFile && typeof product.model3dFile === 'object'
                      ? product.model3dFile.url
                      : product.model3dFile || ''
                  }
                  className='aspect-square'
                  autoRotate={false}
                  showControls={true}
                />
              </motion.div>
            )}
          </div>

          {/* Product Info */}
          <div className='space-y-6'>
            {/* Category & Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className='mb-3'>
                <span className='inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600'>
                  {product.category}
                </span>
              </div>
              <h1 className='text-3xl font-bold text-gray-900 lg:text-4xl'>{product.title}</h1>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className='flex items-center space-x-8 text-gray-500'
            >
              <div className='flex items-center space-x-2'>
                <Eye size={18} />
                <span className='font-medium'>{product.views ?? 0} görüntülenme</span>
              </div>
              <div className='flex items-center space-x-2'>
                <Download size={18} />
                <span className='font-medium'>{product.downloads ?? 0} indirme</span>
              </div>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className='flex items-center space-x-4'
            >
              {isFree ? (
                <span className='rounded-full bg-emerald-100 px-4 py-2 text-xl font-bold text-emerald-700 ring-1 ring-emerald-200'>
                  Ücretsiz
                </span>
              ) : (
                <>
                  <div className='text-3xl font-bold text-gray-900'>₺{product.price}</div>
                </>
              )}
            </motion.div>

            {/* Description */}
            {product.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>Açıklama</h3>
                <p className='leading-relaxed text-gray-600'>{product.description}</p>
              </motion.div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>Özellikler</h3>
                <ul className='space-y-2'>
                  {product.features.map((feature, index) => (
                    <li key={index} className='flex items-center space-x-3'>
                      <Check size={18} className='text-green-500' />
                      <span className='text-gray-600'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>Etiketler</h3>
                <div className='flex flex-wrap gap-2'>
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className='rounded-lg bg-linear-to-r from-gray-100 to-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            {!isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className='space-y-4'
              >
                {isPurchased ? (
                  <motion.div className='rounded-xl border-2 border-emerald-500 bg-emerald-50 p-6 text-center'>
                    <Check size={48} className='mx-auto mb-3 text-emerald-600' />
                    <p className='mb-2 text-lg font-semibold text-emerald-900'>Bu ürünü zaten satın aldınız</p>
                    <p className='mb-4 text-sm text-emerald-700'>Kütüphanenizden indirebilirsiniz</p>
                    <Link href='/kullanici-paneli/satin-almalar'>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='flex w-full items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800'
                      >
                        <Download size={20} />
                        <span>Kütüphaneme Git</span>
                      </motion.button>
                    </Link>
                  </motion.div>
                ) : (
                  <div className='flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4'>
                    {isFree ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className='flex flex-1 items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800'
                      >
                        <Download size={20} />
                        <span>Ücretsiz İndir</span>
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddToCart}
                          className='flex flex-1 items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800'
                        >
                          <ShoppingCart size={20} />
                          <span>Sepete Ekle</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleBuyNow}
                          className='flex flex-1 items-center justify-center space-x-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-4 font-semibold text-blue-600 transition-all duration-300 hover:bg-blue-50'
                        >
                          <Download size={20} />
                          <span>Hemen Satın Al</span>
                        </motion.button>
                      </>
                    )}
                  </div>
                )}

                {/* Favorite Button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`flex w-full items-center justify-center space-x-2 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isFavorite ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
                  <span>{isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}</span>
                </button>
              </motion.div>
            )}

            {/* Owner Message */}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className='rounded-xl border border-blue-200 bg-blue-50 p-6 text-center'
              >
                <p className='text-lg font-semibold text-blue-900'>Bu sizin ürününüz</p>
                <p className='mt-2 text-sm text-blue-700'>
                  Kendi ürününüzü satın alamaz veya sepete ekleyemezsiniz.
                </p>
                <Link
                  href={`/magaza-paneli/urun-ekle?productId=${product.id}`}
                  className='mt-4 inline-block rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700'
                >
                  Ürünü Düzenle
                </Link>
              </motion.div>
            )}

            {/* Author Info */}
            {product.author && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className='rounded-xl border border-gray-200 bg-white p-6'
              >
                <div className='flex items-center space-x-4'>
                  {product.author.profileImage ? (
                    <img
                      src={product.author.profileImage}
                      alt={product.author.storeName || `${product.author.firstName} ${product.author.lastName}`}
                      className='h-16 w-16 rounded-full object-cover'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-16 w-16 rounded-full bg-linear-to-br from-blue-400 to-purple-500 shadow-md ${
                      product.author.profileImage ? 'hidden' : 'flex items-center justify-center'
                    }`}
                  >
                    <User size={32} className='text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2'>
                      <h4 className='text-lg font-semibold text-gray-900'>
                        {product.author.storeName || `${product.author.firstName} ${product.author.lastName}`}
                      </h4>
                      <Check size={18} className='text-blue-500' />
                    </div>
                    <p className='text-gray-500'>Satıcı</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className='mt-12 rounded-2xl bg-white p-8 shadow-lg'
        >
          <h2 className='mb-6 text-2xl font-bold text-gray-900'>Teknik Özellikler</h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {product.polygons && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Polygon Sayısı:</span>
                <span className='font-semibold text-gray-900'>{product.polygons.toLocaleString()}</span>
              </div>
            )}
            {product.vertices && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Vertex Sayısı:</span>
                <span className='font-semibold text-gray-900'>{product.vertices.toLocaleString()}</span>
              </div>
            )}
            {product.geometry && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Geometri:</span>
                <span className='font-semibold text-gray-900'>{product.geometry}</span>
              </div>
            )}
            {product.license && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Lisans:</span>
                <span className='font-semibold text-gray-900'>{product.license}</span>
              </div>
            )}
            {product.gameReady && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Oyun Hazır:</span>
                <span className='font-semibold text-green-600'>Evet</span>
              </div>
            )}
            {product.productFiles && product.productFiles.length > 0 && (
              <div className='flex justify-between border-b border-gray-100 py-2'>
                <span className='font-medium text-gray-600'>Dosya Sayısı:</span>
                <span className='font-semibold text-gray-900'>{product.productFiles.length}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Same Category Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className='mt-12'
          >
            <h2 className='mb-6 text-2xl font-bold text-gray-900'>Aynı Kategorideki Diğer Ürünler</h2>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {relatedProducts.map((relatedProduct, index) => (
                <Link key={relatedProduct.id} href={`/urun/${relatedProduct.slug || relatedProduct.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + index * 0.1, duration: 0.4 }}
                    className='group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl'
                  >
                    <div className='relative h-48 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200'>
                      <img
                        src={relatedProduct.coverImage || '/logo.svg'}
                        alt={relatedProduct.title}
                        className='h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110'
                        onError={(e) => (e.currentTarget.src = '/logo.svg')}
                      />
                    </div>
                    <div className='p-4'>
                      <h3 className='mb-2 line-clamp-2 font-semibold text-gray-900'>
                        {relatedProduct.title}
                      </h3>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <Eye size={14} className='text-gray-400' />
                          <span className='text-sm font-medium text-gray-600'>
                            {relatedProduct.views ?? 0}
                          </span>
                        </div>
                        {Number(relatedProduct.price ?? 0) <= 0 ? (
                          <span className='rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700'>
                            Ücretsiz
                          </span>
                        ) : (
                          <span className='text-lg font-bold text-gray-900'>₺{relatedProduct.price}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

