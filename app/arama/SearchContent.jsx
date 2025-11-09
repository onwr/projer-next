'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, Download, User, Filter, X } from 'lucide-react';

export const SearchContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [isFree, setIsFree] = useState('');
  const [license, setLicense] = useState('');
  const [sort, setSort] = useState('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const [categories, setCategories] = useState([]);
  const [subcategoryMap, setSubcategoryMap] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const licenses = ['Royalty free, no AI', 'Royalty free, AI', 'Editorial', 'Commercial'];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.ok && data.categories) {
          setCategories(data.categories.map((cat) => cat.name));
          const mapped = {};
          data.categories.forEach((parentCategory) => {
            if (Array.isArray(parentCategory.children) && parentCategory.children.length > 0) {
              mapped[parentCategory.name] = parentCategory.children.map((child) => child.name);
            }
          });
          setSubcategoryMap(mapped);
        }
      } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    const categoryParam = searchParams.get('category') || '';
    const subcategoryParam = searchParams.get('subcategory') || '';
    const isFreeParam = searchParams.get('isFree') || '';
    const licenseParam = searchParams.get('license') || '';
    const sortParam = searchParams.get('sort') || 'newest';
    const pageParam = searchParams.get('page') || '1';

    setQuery(queryParam);
    setCategory(categoryParam);
    setSubcategory(subcategoryParam);
    setIsFree(isFreeParam);
    setLicense(licenseParam);
    setSort(sortParam);
    setPage(Number(pageParam));
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (isFree === 'true' || isFree === 'false') params.set('isFree', isFree);
    if (license) params.set('license', license);
    if (sort) params.set('sort', sort);
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    setIsLoading(true);
    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (data?.ok && Array.isArray(data.items)) {
          let filteredItems = data.items;
          if (priceMin || priceMax) {
            filteredItems = filteredItems.filter((product) => {
              const priceValue = Number(product.price ?? 0);
              const minValue = priceMin ? Number(priceMin) : 0;
              const maxValue = priceMax ? Number(priceMax) : Infinity;
              return priceValue >= minValue && priceValue <= maxValue;
            });
          }
          setItems(filteredItems);
          setTotal(data.total || 0);
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

    return () => controller.abort();
  }, [query, category, subcategory, isFree, license, sort, priceMin, priceMax, page, pageSize]);

  const updateURL = (newParams) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (isFree) params.set('isFree', isFree);
    if (license) params.set('license', license);
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/arama?${params.toString()}`);
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    if (key === 'category') {
      setCategory(value);
      setSubcategory('');
      updateURL({ category: value, subcategory: '', page: '1' });
    } else if (key === 'subcategory') {
      setSubcategory(value);
      updateURL({ subcategory: value, page: '1' });
    } else if (key === 'isFree') {
      setIsFree(value);
      updateURL({ isFree: value, page: '1' });
    } else if (key === 'license') {
      setLicense(value);
      updateURL({ license: value, page: '1' });
    } else if (key === 'sort') {
      setSort(value);
      updateURL({ sort: value, page: '1' });
    } else if (key === 'priceMin') {
      setPriceMin(value);
    } else if (key === 'priceMax') {
      setPriceMax(value);
    } else if (key === 'q') {
      setQuery(value);
      updateURL({ q: value, page: '1' });
    }
  };

  const applyPriceFilter = () => {
    setPage(1);
    updateURL({ priceMin, priceMax, page: '1' });
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setSubcategory('');
    setIsFree('');
    setLicense('');
    setSort('newest');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
    router.push('/arama');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto max-w-screen-2xl px-4 py-8'>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <aside className='w-full lg:w-64 lg:flex-shrink-0'>
            <div className='sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>Filtreler</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='lg:hidden'
                >
                  {showFilters ? <X size={20} /> : <Filter size={20} />}
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Arama
                  </label>
                  <input
                    type='text'
                    value={query}
                    onChange={(event) => handleFilterChange('q', event.target.value)}
                    placeholder='Ürün ara...'
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(event) => handleFilterChange('category', event.target.value)}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    disabled={isLoadingCategories}
                  >
                    <option value=''>Tümü</option>
                    {categories.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {category && subcategoryMap[category] && (
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Alt Kategori
                    </label>
                    <select
                      value={subcategory}
                      onChange={(event) => handleFilterChange('subcategory', event.target.value)}
                      className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    >
                      <option value=''>Tümü</option>
                      {subcategoryMap[category].map((subcategoryName) => (
                        <option key={subcategoryName} value={subcategoryName}>
                          {subcategoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Fiyat Aralığı
                  </label>
                  <div className='flex space-x-2'>
                    <input
                      type='number'
                      value={priceMin}
                      onChange={(event) => setPriceMin(event.target.value)}
                      placeholder='Min'
                      className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                    <input
                      type='number'
                      value={priceMax}
                      onChange={(event) => setPriceMax(event.target.value)}
                      placeholder='Max'
                      className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                  </div>
                  <button
                    onClick={applyPriceFilter}
                    className='mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                  >
                    Uygula
                  </button>
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Fiyat
                  </label>
                  <select
                    value={isFree}
                    onChange={(event) => handleFilterChange('isFree', event.target.value)}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  >
                    <option value=''>Tümü</option>
                    <option value='true'>Ücretsiz</option>
                    <option value='false'>Ücretli</option>
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Lisans
                  </label>
                  <select
                    value={license}
                    onChange={(event) => handleFilterChange('license', event.target.value)}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  >
                    <option value=''>Tümü</option>
                    {licenses.map((licenseName) => (
                      <option key={licenseName} value={licenseName}>
                        {licenseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Sıralama
                  </label>
                  <select
                    value={sort}
                    onChange={(event) => handleFilterChange('sort', event.target.value)}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  >
                    <option value='newest'>En yeni</option>
                    <option value='views'>En çok görüntülenen</option>
                    <option value='downloads'>En çok indirilen</option>
                    <option value='price_asc'>Fiyat (Artan)</option>
                    <option value='price_desc'>Fiyat (Azalan)</option>
                  </select>
                </div>

                <button
                  onClick={clearFilters}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </aside>

          <main className='flex-1'>
            <div className='mb-6'>
              <h1 className='text-3xl font-bold text-gray-900'>
                {query ? `"${query}" için sonuçlar` : 'Arama Sonuçları'}
              </h1>
              <p className='mt-2 text-sm text-gray-600'>
                {total} ürün bulundu
              </p>
            </div>

            {isLoading && (
              <div className='py-12 text-center text-gray-500'>Yükleniyor...</div>
            )}

            {!isLoading && items.length === 0 && (
              <div className='rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm'>
                <p className='text-gray-500'>Sonuç bulunamadı</p>
                <button
                  onClick={clearFilters}
                  className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {items.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className='group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300'
                  >
                    <Link href={`/urun/${product.slug || product.id}`}>
                      <div className='relative h-64 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200'>
                        <img
                          src={product.coverImage || '/logo.svg'}
                          alt={product.title}
                          className='h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110'
                          onError={(event) => {
                            event.currentTarget.src = '/logo.svg';
                          }}
                        />
                        <div className='absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent' />
                      </div>

                      <div className='p-6'>
                        <span className='inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600'>
                          {product.category}
                        </span>
                        <h3 className='mt-3 mb-2 line-clamp-2 text-lg font-bold text-gray-900'>
                          {product.title}
                        </h3>
                        <div className='mb-4 flex items-center space-x-4 text-sm text-gray-500'>
                          <div className='flex items-center space-x-1'>
                            <Eye size={16} />
                            <span>{product.views ?? 0}</span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Download size={16} />
                            <span>{product.downloads ?? 0}</span>
                          </div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
                              <User size={16} />
                            </div>
                            <span className='text-sm font-semibold text-gray-700'>
                              {product.author?.storeName ||
                                `${product.author?.firstName ?? ''} ${product.author?.lastName ?? ''}`.trim() ||
                                'Satıcı'}
                            </span>
                          </div>
                          <div>
                            {Number(product.price ?? 0) <= 0 ? (
                              <span className='rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700'>
                                Ücretsiz
                              </span>
                            ) : (
                              <div className='text-lg font-bold text-gray-900'>₺{product.price}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center space-x-2'>
                <button
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    updateURL({ page: String(newPage) });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:opacity-50'
                >
                  Önceki
                </button>
                <span className='px-4 py-2 text-sm text-gray-600'>
                  Sayfa {page} / {totalPages}
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    updateURL({ page: String(newPage) });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === totalPages}
                  className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:opacity-50'
                >
                  Sonraki
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

