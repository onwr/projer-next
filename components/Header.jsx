'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { openCart } from '@/store/cartSlice';
import { useSession, signOut } from 'next-auth/react';
import {
  ChevronDown,
  Search,
  ShoppingCart,
  Menu,
  X,
  Heart,
  Building,
  Palette,
  Car,
  User,
  Landmark,
  Settings,
  Shirt,
  Pizza,
  Home,
  Headphones,
  Leaf,
  Newspaper,
  Users,
  Compass,
  Atom,
  Dumbbell,
  Shield,
  LogOut,
  UserCircle,
  Folder,
  Loader2,
  BookOpen,
} from 'lucide-react';

// İkon mapping - kategori adlarına göre
const categoryIconMap = {
  'Animals & Pets': Heart,
  'Architecture': Building,
  'Art & Abstract': Palette,
  'Cars & Vehicles': Car,
  'Characters & Creatures': User,
  'Cultural Heritage & History': Landmark,
  'Electronics & Gadgets': Settings,
  'Fashion & Style': Shirt,
  'Food & Drink': Pizza,
  'Furniture & Home': Home,
  'Music': Headphones,
  'Nature & Plants': Leaf,
  'News & Politics': Newspaper,
  'People': Users,
  'Places & Travel': Compass,
  'Science & Technology': Atom,
  'Sports & Fitness': Dumbbell,
  'Weapons & Military': Shield,
};

const getCategoryIcon = (categoryName) => {
  return categoryIconMap[categoryName] || Folder;
};

const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { totalItems: totalItemsFromStore } = useSelector((state) => state.cart);
  const { data: session } = useSession();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState(new Set());
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Hydration hatasını önlemek için client-side'da totalItems'ı set et
  useEffect(() => {
    setMounted(true);
    setTotalItems(totalItemsFromStore);
  }, [totalItemsFromStore]);

  // API'den kategorileri çek
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await fetch('/api/categories');
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.ok && data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          console.warn('Categories API returned invalid data:', data);
          setCategories([]);
        }
      } catch (error) {
        console.error('Categories load error:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const toggleMobileCategory = (categoryId) => {
    setExpandedMobileCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        setIsSearching(true);
        const params = new URLSearchParams({ q: searchQuery.trim(), pageSize: '6' });
        fetch(`/api/products?${params.toString()}`)
          .then(async (r) => {
            const data = await r.json().catch(() => ({}));
            if (data?.ok && Array.isArray(data.items)) {
              setSearchResults(data.items.slice(0, 6));
              setShowDropdown(true);
            } else {
              setSearchResults([]);
              setShowDropdown(false);
            }
          })
          .catch(() => {
            setSearchResults([]);
            setShowDropdown(false);
          })
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
        setShowDropdown(false);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/arama?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className='sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm'
    >
      <div className='container mx-auto max-w-screen-2xl px-4'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/'>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              className='flex items-center'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src='/logo.svg' alt='PROJER.com' />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            className='mx-8 hidden max-w-4xl flex-1 items-center lg:flex'
          >
            {/* Categories Dropdown */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
              className='relative mr-6'
            >
              <motion.button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className='flex items-center space-x-1 rounded-md px-3 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className='text-sm font-medium'>Kategoriler</span>
                <motion.div
                  animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>

              {/* Categories Dropdown Menu */}
              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className='absolute top-full left-0 z-50 mt-2 flex rounded-xl border border-gray-200 bg-white shadow-2xl'
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Ana Kategoriler */}
                    <div className='w-64 border-r border-gray-100 p-4'>
                      <h3 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Kategoriler
                      </h3>
                      {isLoadingCategories ? (
                        <div className='flex items-center justify-center py-8'>
                          <Loader2 size={20} className='animate-spin text-gray-400' />
                        </div>
                      ) : categories.length === 0 ? (
                        <div className='py-8 text-center text-sm text-gray-500'>
                          Kategori bulunamadı
                        </div>
                      ) : (
                        <div className='space-y-1'>
                          {categories.map((category, index) => {
                            const Icon = getCategoryIcon(category.name);
                            const hasChildren = category.children && category.children.length > 0;
                            return (
                              <motion.div
                                key={category.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className='group relative'
                                onMouseEnter={() => hasChildren && setHoveredCategory(category.id)}
                              >
                                <Link
                                  href={`/kategori/${category.slug}`}
                                  onClick={() => setIsCategoryOpen(false)}
                                  className='flex items-center justify-between rounded-lg p-2 transition-colors duration-200 hover:bg-blue-50'
                                >
                                  <div className='flex items-center space-x-2'>
                                    <Icon
                                      size={16}
                                      className='text-gray-600 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600'
                                    />
                                    <span className='text-sm font-medium text-gray-700 transition-colors duration-200 group-hover:text-blue-600'>
                                      {category.name}
                                    </span>
                                  </div>
                                  {hasChildren && (
                                    <ChevronDown
                                      size={12}
                                      className='text-gray-400 transition-transform duration-200 group-hover:rotate-180'
                                    />
                                  )}
                                </Link>
                                {category.productCount > 0 && (
                                  <span className='ml-2 text-xs text-gray-500'>
                                    ({category.productCount})
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Alt Kategoriler */}
                    <AnimatePresence>
                      {hoveredCategory && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className='w-64 p-4'
                        >
                          {(() => {
                            const category = categories.find((c) => c.id === hoveredCategory);
                            if (!category || !category.children || category.children.length === 0) {
                              return null;
                            }
                            return (
                              <>
                                <h3 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                                  {category.name} - Alt Kategoriler
                                </h3>
                                <div className='space-y-1'>
                                  {category.children && category.children.length > 0 ? (
                                    category.children.map((child, index) => {
                                      const Icon = getCategoryIcon(child.name);
                                      return (
                                        <motion.div
                                          key={child.id}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.03 }}
                                        >
                                          <Link
                                            href={`/kategori/${child.slug}`}
                                            onClick={() => setIsCategoryOpen(false)}
                                            className='flex items-center justify-between rounded-lg p-2 transition-colors duration-200 hover:bg-blue-50'
                                          >
                                            <div className='flex items-center space-x-2'>
                                              <Icon
                                                size={14}
                                                className='text-gray-500 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600'
                                              />
                                              <span className='text-xs font-medium text-gray-600 transition-colors duration-200 group-hover:text-blue-600'>
                                                {child.name}
                                              </span>
                                            </div>
                                            {child.productCount > 0 && (
                                              <span className='text-xs text-gray-400'>
                                                ({child.productCount})
                                              </span>
                                            )}
                                          </Link>
                                        </motion.div>
                                      );
                                    })
                                  ) : (
                                    <div className='py-4 text-center text-xs text-gray-400'>
                                      Alt kategori bulunamadı
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
              className='relative max-w-2xl flex-1'
            >
              <div className='relative'>
                <Search
                  size={18}
                  className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                />
                <input
                  ref={searchInputRef}
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Onlarca model arasında arama yapın'
                  className='w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-24 pl-10 text-sm transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none'
                />
                <motion.button
                  onClick={handleSearch}
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ara
                </motion.button>
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showDropdown && (searchResults.length > 0 || isSearching) && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className='absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl'
                  >
                    {isSearching ? (
                      <div className='p-4 text-center text-sm text-gray-500'>Aranıyor...</div>
                    ) : searchResults.length > 0 ? (
                      <div className='max-h-96 overflow-y-auto'>
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/urun/${product.slug || product.id}`}
                            onClick={() => {
                              setShowDropdown(false);
                              setSearchQuery('');
                            }}
                          >
                            <div className='flex items-center space-x-3 border-b border-gray-100 p-3 transition-colors duration-200 hover:bg-gray-50 last:border-b-0'>
                              <img
                                src={product.coverImage || '/logo.svg'}
                                alt={product.title}
                                className='h-12 w-12 rounded-lg object-cover'
                                onError={(e) => (e.currentTarget.src = '/logo.svg')}
                              />
                              <div className='flex-1'>
                                <p className='text-sm font-medium text-gray-900'>{product.title}</p>
                                <p className='text-xs text-gray-500'>
                                  {Number(product.price ?? 0) <= 0 ? (
                                    <span className='text-emerald-600'>Ücretsiz</span>
                                  ) : (
                                    <>₺{product.price}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                        <div className='border-t border-gray-200 p-2'>
                          <button
                            onClick={handleSearch}
                            className='w-full rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-100'
                          >
                            Tüm sonuçları göster
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='p-4 text-center text-sm text-gray-500'>
                        Sonuç bulunamadı
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Side - Cart & Auth */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease: 'easeOut' }}
            className='flex items-center space-x-4'
          >
            {/* Kütüphanem Button - Sadece giriş yapmış kullanıcılara göster */}
            {session && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.4, ease: 'easeOut' }}
                onClick={() => router.push('/kullanici-paneli/satin-almalar')}
                className='relative p-2 text-gray-600 transition-colors duration-200 hover:text-blue-600'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title='Kütüphanem'
              >
                <BookOpen size={20} />
              </motion.button>
            )}

              {/* Shopping Cart */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.4, ease: 'easeOut' }}
              onClick={() => dispatch(openCart())}
              className='relative p-2 text-gray-600 transition-colors duration-200 hover:text-blue-600'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ShoppingCart size={20} />
              {mounted && totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.3, ease: 'easeOut' }}
                  className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white'
                >
                  {totalItems}
                </motion.span>
              )}
            </motion.button>

            {/* Auth Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.5, ease: 'easeOut' }}
              className='hidden items-center space-x-2 sm:flex'
            >
              {session ? (
                <div className='relative'>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserCircle size={20} />
                    <span>{session.user.name || 'Kullanıcı'}</span>
                    <ChevronDown size={14} />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className='absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl'
                      >
                        <div className='space-y-1'>
                          <div className='px-3 py-2 text-sm text-gray-500'>
                            {session.user.email}
                          </div>
                          <div className='border-t border-gray-100'></div>
                          <Link
                            href={
                              session.user.userType === 'STORE'
                                ? '/magaza-paneli'
                                : session.user.userType === 'ADMIN'
                                  ? '/yonetici'
                                  : '/kullanici-paneli'
                            }
                            className='flex items-center space-x-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings size={16} />
                            <span>Panel</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className='flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50'
                          >
                            <LogOut size={16} />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href='/giris'>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6, duration: 0.4, ease: 'easeOut' }}
                      className='px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Giriş Yap
                    </motion.button>
                  </Link>
                  <Link href='/kayit'>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8, duration: 0.4, ease: 'easeOut' }}
                      className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Ücretsiz Hesap Oluştur
                    </motion.button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.4, ease: 'easeOut' }}
            className='p-2 text-gray-600 lg:hidden'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className='border-t border-gray-100 py-4 lg:hidden'
            >
              {/* Mobile Search */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                className='relative mb-4'
              >
                <Search
                  size={18}
                  className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                />
                <div className='flex space-x-2'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder='Onlarca model arasında arama yapın'
                    className='flex-1 rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none'
                  />
                  <motion.button
                    onClick={handleSearch}
                    className='rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ara
                  </motion.button>
                </div>
              </motion.div>

              {/* Mobile Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
                className='mb-4'
              >
                <h3 className='mb-3 text-sm font-medium text-gray-700'>Kategoriler</h3>
                {isLoadingCategories ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 size={16} className='animate-spin text-gray-400' />
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {categories.map((category, index) => {
                      const Icon = getCategoryIcon(category.name);
                      const hasChildren = category.children && category.children.length > 0;
                      const isExpanded = expandedMobileCategories.has(category.id);
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.02, duration: 0.3, ease: 'easeOut' }}
                        >
                          <div className='flex items-center justify-between rounded-lg p-2 hover:bg-blue-50'>
                            <Link
                              href={`/kategori/${category.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className='flex flex-1 items-center space-x-2'
                            >
                              <Icon
                                size={14}
                                className='text-gray-600 group-hover:text-blue-600'
                              />
                              <span className='text-xs font-medium text-gray-700'>
                                {category.name}
                              </span>
                              {category.productCount > 0 && (
                                <span className='text-xs text-gray-400'>
                                  ({category.productCount})
                                </span>
                              )}
                            </Link>
                            {hasChildren && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleMobileCategory(category.id);
                                }}
                                className='p-1 text-gray-400 hover:text-gray-600'
                              >
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                          {hasChildren && isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className='ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2'
                            >
                              {category.children.map((child) => {
                                const ChildIcon = getCategoryIcon(child.name);
                                return (
                                  <Link
                                    key={child.id}
                                    href={`/kategori/${child.slug}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className='flex items-center space-x-2 rounded-lg p-1.5 text-xs text-gray-600 hover:bg-blue-50'
                                  >
                                    <ChildIcon size={12} className='text-gray-400' />
                                    <span>{child.name}</span>
                                    {child.productCount > 0 && (
                                      <span className='text-xs text-gray-400'>
                                        ({child.productCount})
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Mobile Auth Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
                className='flex flex-col space-y-2'
              >
                {session ? (
                  <>
                    <div className='px-3 py-2 text-sm text-gray-500'>{session.user.email}</div>
                    <Link
                      href={
                        session.user.userType === 'STORE'
                          ? '/magaza-paneli'
                          : session.user.userType === 'ADMIN'
                            ? '/yonetici'
                            : '/kullanici-paneli'
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3, ease: 'easeOut' }}
                        className='w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Panel
                      </motion.button>
                    </Link>
                    <motion.button
                      onClick={handleLogout}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.3, ease: 'easeOut' }}
                      className='w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700'
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Çıkış Yap
                    </motion.button>
                  </>
                ) : (
                  <>
                    <Link href='/giris'>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3, ease: 'easeOut' }}
                        className='w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Giriş Yap
                      </motion.button>
                    </Link>
                    <Link href='/kayit'>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.3, ease: 'easeOut' }}
                        className='w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Ücretsiz Hesap Oluştur
                      </motion.button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
