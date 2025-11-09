'use client';

import { motion } from 'framer-motion';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

const PaymentFailed = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center'
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100'
        >
          <XCircle size={48} className='text-red-600' />
        </motion.div>

        <h1 className='mb-3 text-2xl font-bold text-gray-900'>Ödeme Başarısız</h1>
        <p className='mb-6 text-gray-600'>
          Ödeme işlemi tamamlanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.
        </p>

        <div className='space-y-3'>
          <Link
            href='/odeme'
            className='flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700'
          >
            <RefreshCw size={20} />
            <span>Tekrar Dene</span>
          </Link>

          <Link
            href='/'
            className='flex w-full items-center justify-center space-x-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50'
          >
            <Home size={20} />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailed;

