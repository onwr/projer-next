'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { clearCart } from '@/store/cartSlice';
import Link from 'next/link';

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const merchantOid = searchParams.get('merchant_oid');
    if (merchantOid) {
      dispatch(clearCart());
    }
  }, [searchParams, dispatch]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 via-blue-50 to-purple-50 px-4 py-12'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl md:p-12'
      >
            {/* Decorative background elements */}
            <div className='absolute -top-10 -right-10 h-40 w-40 rounded-full bg-linear-to-br from-emerald-400/20 to-blue-400/20 blur-3xl' />
            <div className='absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-linear-to-br from-purple-400/20 to-pink-400/20 blur-3xl' />

        <div className='relative text-center'>
          {/* Success icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50'
          >
            <CheckCircle2 size={48} className='text-white' />
          </motion.div>

          {/* Confetti effect - client-side only to avoid hydration mismatch */}
          {mounted && (
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {[...Array(20)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                const duration = 2 + Math.random() * 2;
                const delay = Math.random() * 0.5;
                
                return (
                  <motion.div
                    key={i}
                    className='absolute h-2 w-2 rounded-full'
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      backgroundColor,
                    }}
                    initial={{ y: -100, opacity: 0, rotate: 0 }}
                    animate={{
                      y: 500,
                      opacity: [0, 1, 1, 0],
                      rotate: 360,
                    }}
                    transition={{
                      duration,
                      delay,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='mb-4 text-3xl font-bold text-gray-900 md:text-4xl'
          >
            Satın Alındı! 🎉
          </motion.h1>

          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='mb-8 space-y-3'
          >
            <div className='flex items-center justify-center space-x-2 text-emerald-600'>
              <Sparkles size={20} />
              <p className='text-lg font-semibold'>Ürün kütüphanenize eklendi</p>
            </div>
            <p className='text-gray-600'>
              Satın aldığınız ürünler kütüphanenizde görünmektedir. İstediğiniz zaman indirebilirsiniz.
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='space-y-4'
          >
              <Link
              href='/kullanici-paneli/satin-almalar'
              className='group flex w-full items-center justify-center space-x-3 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105'
            >
              <Download size={20} />
              <span>Kütüphaneme Git</span>
            </Link>

            <div className='flex gap-4'>
              <Link
                href='/kullanici-paneli/satin-almalar'
                className='flex flex-1 items-center justify-center space-x-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
              >
                <ShoppingBag size={20} />
                <span>Siparişlerim</span>
              </Link>

              <Link
                href='/'
                className='flex flex-1 items-center justify-center space-x-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:border-gray-500 hover:bg-gray-50'
              >
                <Home size={20} />
                <span>Ana Sayfa</span>
              </Link>
            </div>
          </motion.div>

          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className='mt-8 rounded-xl bg-blue-50 p-4 text-left'
          >
            <p className='text-sm text-gray-700'>
              <span className='font-semibold text-blue-900'>💡 Bilgi:</span> Satın aldığınız ürünleri{' '}
              <Link href='/kullanici-paneli/satin-almalar' className='font-semibold text-blue-600 underline'>
                Kütüphanem
              </Link>{' '}
              sayfasından görüntüleyip indirebilirsiniz.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const PaymentSuccess = () => (
  <Suspense
    fallback={
      <div className='flex min-h-screen items-center justify-center bg-white text-slate-500'>
        Yükleniyor...
      </div>
    }
  >
    <PaymentSuccessContent />
  </Suspense>
);

export default PaymentSuccess;
