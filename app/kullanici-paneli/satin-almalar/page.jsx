'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, Eye, Search, ArrowLeft, Loader2 } from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/user/purchases?status=COMPLETED');
        if (!res.ok) throw new Error('Satın alımlar yüklenemedi');
        const data = await res.json();
        if (data.ok) {
          setPurchases(data.purchases || []);
        }
      } catch (error) {
        console.error('Purchases load error:', error);
        setPurchases([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPurchases();
  }, []);

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

  const filteredPurchases = purchases.filter((purchase) =>
    searchQuery
      ? purchase.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto max-w-7xl px-4 py-8'>
        <Link
          href='/kullanici-paneli'
          className='mb-6 inline-flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900'
        >
          <ArrowLeft size={20} />
          <span>Kullanıcı Paneline Dön</span>
        </Link>

        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-900'>Satın Almalarım</h1>
        </div>

        <div className='mb-6'>
          <div className='relative'>
            <Search
              size={20}
              className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
            />
            <input
              type='text'
              placeholder='Ürün ara...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full rounded-xl border border-gray-300 bg-white py-3 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
            />
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Loader2 className='mx-auto mb-4 animate-spin text-blue-600' size={32} />
              <div className='text-lg font-semibold text-gray-600'>Yükleniyor...</div>
            </div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className='rounded-2xl bg-white p-12 shadow-lg text-center'>
            <p className='text-lg text-gray-500'>
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz satın alınan ürün bulunmuyor'}
            </p>
            {!searchQuery && (
              <Link
                href='/'
                className='mt-4 inline-block text-blue-600 hover:text-blue-700 hover:underline'
              >
                Alışverişe başla
              </Link>
            )}
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredPurchases.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className='overflow-hidden rounded-2xl bg-white shadow-lg'
              >
                <div className='relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200'>
                  <img
                    src={purchase.coverImage || '/logo.svg'}
                    alt={purchase.productTitle}
                    className='h-full w-full object-cover'
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.svg';
                    }}
                  />
                </div>
                <div className='p-6'>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900 line-clamp-2'>
                    {purchase.productTitle}
                  </h3>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>{purchase.category}</span>
                    <span className='text-xl font-bold text-blue-600'>
                      ₺{purchase.price.toFixed(2)}
                    </span>
                  </div>
                  <div className='mb-4 text-xs text-gray-500'>
                    <p>Satın alma: {purchase.date}</p>
                    <p>Sipariş No: {purchase.orderId}</p>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => handleDownload(purchase.productSlug, purchase.productId)}
                      className='flex flex-1 items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700'
                    >
                      <Download size={16} />
                      <span>İndir</span>
                    </button>
                    {purchase.productSlug && (
                      <Link
                        href={`/urun/${purchase.productSlug}`}
                        className='flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50'
                      >
                        <Eye size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
