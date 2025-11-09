'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

const Hero = () => {
  return (
    <section className='relative min-h-screen overflow-hidden bg-white'>
      <div className='absolute inset-0 z-0'>
        <img
          src='/images/hero-img.svg'
          alt='3D Marketplace Hero Background'
          className='h-full w-full object-cover object-center'
        />
        <div className='absolute inset-0 bg-white/80' />
      </div>

      <div className='relative z-10 container mx-auto max-w-screen-2xl px-4 py-20'>
        <div className='flex min-h-[80vh] items-center justify-center'>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='max-w-4xl space-y-8 text-center'
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className='space-y-4'
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className='text-6xl leading-tight font-black text-gray-900 lg:text-7xl'
              >
                Yeni Nesil
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className='relative text-6xl leading-tight font-black text-gray-900 lg:text-7xl'
              >
                3B Pazaryeri
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
                  className='absolute bottom-2 left-0 -z-10 h-6 bg-linear-to-r from-orange-400 to-pink-500 opacity-80'
                  style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                />
              </motion.h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className='max-w-lg text-xl leading-relaxed text-gray-600'
            >
              Geniş model koleksiyonu, anlık fiyat güncellemeleri ve 7/24 destekle 3B alışverişinizi
              sorunsuz hale getiriyoruz.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className='flex w-full flex-col justify-center gap-4 sm:flex-row sm:w-auto'
            >
              <Link href='/kayit' className='w-full sm:w-auto'>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(61, 163, 244, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className='group flex w-full items-center justify-center space-x-2 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:w-auto'
                  style={{ backgroundColor: '#3da3f4' }}
                >
                  <span>Ücretsiz Hesap Oluştur</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                </motion.button>
              </Link>

              <Link href='/arama' className='w-full sm:w-auto'>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#f8fafc' }}
                  whileTap={{ scale: 0.95 }}
                  className='group flex w-full items-center justify-center space-x-2 rounded-xl border-2 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-300 sm:w-auto'
                  style={{ borderColor: '#3da3f4' }}
                >
                  <Search size={20} />
                  <span>Şimdi Arama Yap</span>
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className='flex flex-wrap justify-center gap-8 pt-8'
            >
              {[
                { number: '10K+', label: '3B Model' },
                { number: '500+', label: 'Kategori' },
                { number: '50K+', label: 'Kullanıcı' },
                { number: '99%', label: 'Memnuniyet' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6 + index * 0.1, duration: 0.5 }}
                  className='text-center'
                >
                  <div className='text-3xl font-bold text-gray-900'>{stat.number}</div>
                  <div className='text-sm text-gray-600'>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
