'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className='bg-gray-50 border-t border-gray-200'>
      <div className='container mx-auto max-w-screen-2xl px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-8 mb-8'>
          {/* Logo - Left */}
          <div className='lg:col-span-2'>
            <div className='flex items-center space-x-2 mb-4'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-lg'>P</span>
              </div>
              <span className='text-blue-600 font-bold text-xl'>PROJER.com</span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className='lg:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-6'>
            {/* Lisanslar hakkında */}
            <div>
              <h3 className='text-blue-600 font-semibold mb-3 text-sm'>Lisanslar hakkında</h3>
              <ul className='space-y-2'>
                <li>
                  <Link href='/lisanslar-hakkinda' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    lisanslar hakkında
                  </Link>
                </li>
              </ul>
            </div>

            {/* Politika&Sözleşmeler */}
            <div>
              <h3 className='text-blue-600 font-semibold mb-3 text-sm'>Politika&Sözleşmeler</h3>
              <ul className='space-y-2'>
                <li>
                  <Link href='/kullanim-kosullari' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    Kullanım koşulları
                  </Link>
                </li>
                <li>
                  <Link href='/gizlilik-politikasi' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    gizlilik politikası
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hesap */}
            <div>
              <h3 className='text-blue-600 font-semibold mb-3 text-sm'>Hesap</h3>
              <ul className='space-y-2'>
                <li>
                  <Link href='/giris' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    Giriş yap
                  </Link>
                </li>
                <li>
                  <Link href='/kayit' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    Kayıt ol
                  </Link>
                </li>
              </ul>
            </div>

            {/* Yardım */}
            <div>
              <h3 className='text-blue-600 font-semibold mb-3 text-sm'>Yardım</h3>
              <ul className='space-y-2'>
                <li>
                  <Link href='/sss' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    SSS
                  </Link>
                </li>
                <li>
                  <Link href='/iletisim' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    Bize Ulaşın
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sosyal Medya */}
            <div>
              <h3 className='text-blue-600 font-semibold mb-3 text-sm'>Sosyal Medya</h3>
              <ul className='space-y-2'>
                <li>
                  <Link href='#' className='text-gray-700 text-sm hover:text-blue-600 transition-colors'>
                    NextSocial
                  </Link>
                </li>
                <li>
                  <Link 
                    href='#' 
                    className='text-gray-700 text-sm hover:text-blue-600 transition-colors flex items-center space-x-2'
                  >
                    <Youtube size={16} />
                    <span>youtube</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href='#' 
                    className='text-gray-700 text-sm hover:text-blue-600 transition-colors flex items-center space-x-2'
                  >
                    <Instagram size={16} />
                    <span>instagram</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 3D Flower Decoration - Right */}
          <div className='lg:col-span-1 hidden lg:flex items-center justify-end'>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
              className='relative w-full h-full max-w-[200px] max-h-[200px]'
            >
              {/* 3D Flower SVG Illustration */}
              <svg
                viewBox='0 0 200 200'
                className='w-full h-full'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                {/* Large Pink Flower */}
                <g>
                  <circle cx='100' cy='80' r='35' fill='#FFB6C1' opacity='0.9' />
                  <circle cx='85' cy='70' r='15' fill='#FFC0CB' />
                  <circle cx='115' cy='70' r='15' fill='#FFC0CB' />
                  <circle cx='100' cy='60' r='12' fill='#FFD700' />
                </g>
                
                {/* Orange Flower */}
                <circle cx='150' cy='120' r='20' fill='#FFA500' opacity='0.8' />
                <circle cx='145' cy='115' r='8' fill='#FFD700' />
                
                {/* Yellow Flower */}
                <circle cx='50' cy='130' r='18' fill='#FFD700' opacity='0.8' />
                <circle cx='55' cy='125' r='7' fill='#FFA500' />
                
                {/* Light Blue Flower */}
                <circle cx='180' cy='80' r='15' fill='#87CEEB' opacity='0.7' />
                <circle cx='175' cy='75' r='6' fill='#B0E0E6' />
                
                {/* Green Leaves and Stems */}
                <ellipse cx='100' cy='120' rx='8' ry='25' fill='#90EE90' />
                <ellipse cx='150' cy='140' rx='6' ry='20' fill='#90EE90' />
                <ellipse cx='50' cy='150' rx='5' ry='18' fill='#90EE90' />
                <ellipse cx='180' cy='100' rx='4' ry='15' fill='#90EE90' />
                
                {/* Small Leaves */}
                <path
                  d='M 95 125 Q 90 130 95 135 Q 100 130 95 125'
                  fill='#32CD32'
                  opacity='0.8'
                />
                <path
                  d='M 145 145 Q 140 150 145 155 Q 150 150 145 145'
                  fill='#32CD32'
                  opacity='0.8'
                />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Copyright */}
        <div className='border-t border-gray-200 pt-6'>
          <div className='text-center'>
            <p className='text-gray-600 text-sm'>
              © 2025 projer. Tüm haklar saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
