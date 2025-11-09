'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { addToCart, openCart } from '@/store/cartSlice';
import {
  ArrowLeft,
  Eye,
  Download,
  Heart,
  ShoppingCart,
  Check,
  Grid,
  List,
  Loader2,
} from 'lucide-react';

const CategoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const slug = params?.slug;

  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [favoritedProducts, setFavoritedProducts] = useState(new Set());
  const [purchasedProducts, setPurchasedProducts] = useState(new Set());

  useEffect(() => {
    if (!slug) return;

    const loadCategory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/categories/${slug}`);
        const data = await res.json();
        if (data.ok) {
          setCategory(data.category);
          setChildren(data.children || []);
        } else {
          console.error('Category load error:', data.error);
        }
      } catch (error) {
        console.error('Category load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategory();
  }, [slug]);

  useEffect(() => {
    if (!category || !slug) return;

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const params = new URLSearchParams({
          category: category.name,
          sort,
          page: String(page),
          pageSize: '12',
        });

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.items)) {
          setProducts(data.items);
          setTotal(data.total || 0);

          // Favori ve satın alınan durumlarını kontrol et
          const favoriteSet = new Set();
          const purchasedSet = new Set();

          await Promise.all(
            data.items.map(async (item) => {
              try {
                const favoriteRes = await fetch(`/api/user/favorites/${item.slug || item.id}`);
                const favoriteData = await favoriteRes.json().catch(() => ({ isFavorite: false }));
                if (favoriteData.isFavorite) {
                  favoriteSet.add(item.id);
                }

                const purchasedRes = await fetch(`/api/products/${item.slug || item.id}/purchased`);
                const purchasedData = await purchasedRes.json().catch(() => ({ purchased: false }));
                if (purchasedData.purchased) {
                  purchasedSet.add(item.id);
                }
              } catch (err) {
                // Sessiz hata
              }
            })
          );

          setFavoritedProducts(favoriteSet);
          setPurchasedProducts(purchasedSet);
        }
      } catch (error) {
        console.error('Products load error:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [category, sort, page, slug]);

  const handleToggleFavorite = async (product, e) => {
    e.stopPropagation();
    const productId = product.id;
    const isCurrentlyFavorited = favoritedProducts.has(productId);

    setFavoritedProducts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorited) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });

    try {
      const res = await fetch(`/api/user/favorites/${product.slug || product.id}`, {
        method: isCurrentlyFavorited ? 'DELETE' : 'POST',
      });
      const data = await res.json();
      if (!data.ok) {
        // Revert on error
        setFavoritedProducts((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyFavorited) {
            newSet.add(productId);
          } else {
            newSet.delete(productId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
    }
  };

  const totalPages = Math.ceil(total / 12);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-12 w-12 animate-spin text-blue-600' />
          <p className='text-gray-600'>Kategori yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-gray-900'>Kategori bulunamadı</h1>
          <Link
            href='/'
            className='inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Category Hero */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 py-12'>
        <div className='container mx-auto max-w-7xl px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-6'
          >
            <Link
              href='/'
              className='flex items-center space-x-2 text-white/80 transition-colors duration-200 hover:text-white'
            >
              <ArrowLeft size={20} />
              <span>Ana Sayfa</span>
            </Link>
            <div className='hidden h-8 w-px bg-white/30 md:block' />
            <div className='flex items-center space-x-4'>
              <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm'>
                {category.image ? (
                  <img src={category.image} alt={category.name} className='h-10 w-10 object-contain' />
                ) : (
                  <div className='h-10 w-10 rounded-full bg-white/30' />
                )}
              </div>
              <div>
                <h1 className='text-3xl font-bold text-white lg:text-4xl'>{category.name}</h1>
                <p className='text-lg text-white/80'>
                  {category.totalProductCount || category.productCount || 0} ürün
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className='container mx-auto max-w-7xl px-4 py-8'>
        {/* Alt Kategoriler */}
        {children && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='mb-8 rounded-xl bg-white p-6 shadow-sm'
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Alt Kategoriler</h2>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
              {children.map((child, index) => (
                <Link
                  key={child.id}
                  href={`/kategori/${child.slug}`}
                  className='group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-md'
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className='flex items-center space-x-3'
                  >
                    {child.image && (
                      <div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg'>
                        <img
                          src={child.image}
                          alt={child.name}
                          className='h-full w-full object-cover'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 group-hover:text-blue-600'>{child.name}</h3>
                      <p className='text-sm text-gray-500'>{child.productCount || 0} ürün</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sort and Filter */}
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-2xl font-bold text-gray-900'>Ürünler</h2>
          <div className='flex items-center space-x-4'>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value='newest'>En yeni</option>
              <option value='views'>En çok görüntülenen</option>
              <option value='downloads'>En çok indirilen</option>
              <option value='price_asc'>Fiyat (Artan)</option>
              <option value='price_desc'>Fiyat (Azalan)</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoadingProducts ? (
          <div className='flex min-h-[400px] items-center justify-center'>
            <div className='text-center'>
              <Loader2 className='mx-auto mb-4 h-12 w-12 animate-spin text-blue-600' />
              <p className='text-gray-600'>Ürünler yükleniyor...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className='flex min-h-[400px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-xl text-gray-600'>Bu kategoride henüz ürün bulunmuyor</p>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className='group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300'
                >
                  <Link href={`/urun/${product.slug || product.id}`}>
                    <div className='relative h-64 overflow-hidden bg-gray-100'>
                      <img
                        src={product.coverImage || '/logo.svg'}
                        alt={product.title}
                        className='h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110'
                        onError={(e) => (e.currentTarget.src = '/logo.svg')}
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent' />

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
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`/api/products/${product.slug || product.id}/download`, {
                                    method: 'POST',
                                  });
                                  const data = await res.json();
                                  if (data.ok && data.files) {
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
                                    setPurchasedProducts((prev) => new Set([...prev, product.id]));
                                    setProducts((prevItems) =>
                                      prevItems.map((item) =>
                                        item.id === product.id ? { ...item, downloads: (item.downloads || 0) + 1 } : item
                                      )
                                    );
                                  }
                                } catch (error) {
                                  console.error('Download error:', error);
                                }
                              }}
                              className='flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800'
                            >
                              <Download size={18} />
                              <span className='font-semibold'>Ücretsiz İndir</span>
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const productForCart = {
                                  ...product,
                                  price: String(product.price ?? 0),
                                  coverImage: product.coverImage || product.image || '/logo.svg',
                                };
                                dispatch(addToCart({ product: productForCart }));
                                dispatch(openCart());
                              }}
                              className='flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-blue-800'
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
                      <div className='mb-3'>
                        <span className='inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600'>
                          {product.category}
                        </span>
                      </div>

                      <h3 className='mb-4 line-clamp-2 text-lg font-bold leading-tight text-gray-900'>{product.title}</h3>

                      <div className='mb-4 flex items-center justify-start space-x-6 text-sm text-gray-500'>
                        <div className='flex items-center space-x-1'>
                          <Eye size={16} />
                          <span className='font-medium'>{product.views ?? 0}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <Download size={16} />
                          <span className='font-medium'>{product.downloads ?? 0}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <Heart
                            size={16}
                            className={favoritedProducts.has(product.id) ? 'fill-current text-red-500' : ''}
                          />
                          <span className='font-medium'>{product.likes ?? 0}</span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          {product.author?.profileImage ? (
                            <img
                              src={product.author.profileImage}
                              alt={product.author.name || 'Satıcı'}
                              className='h-8 w-8 rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300'>
                              <span className='text-xs font-medium text-gray-600'>
                                {(product.author?.name || 'S').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className='text-sm text-gray-600'>{product.author?.name || 'Satıcı'}</span>
                        </div>
                        <div className='text-lg font-bold text-gray-900'>
                          {Number(product.price ?? 0) <= 0 ? (
                            <span className='text-green-600'>Ücretsiz</span>
                          ) : (
                            `₺${Number(product.price).toFixed(2)}`
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-8 flex justify-center space-x-2'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Önceki
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`rounded-lg px-4 py-2 ${
                      page === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;

