'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.ok && data.categories) {
          // Sadece parent kategorileri al (parentId null olanlar)
          const parentCategories = data.categories;
          
          // Size mapping - dinamik olarak dağıt
          const sizeMap = [
            'col-span-2',
            'col-span-1',
            'col-span-1 row-span-2',
            'col-span-1',
            'col-span-1 row-span-2',
            'col-span-1',
            'col-span-1',
            'col-span-2',
          ];
          
          const categoriesWithSize = parentCategories.map((cat, index) => ({
            ...cat,
            size: sizeMap[index % sizeMap.length] || 'col-span-1',
          }));
          
          setCategories(categoriesWithSize);
        }
      } catch (error) {
        console.error('Categories load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className='pt-20'>
      <div className='container mx-auto max-w-screen-2xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className='mb-16 text-center'
        >
          <h2 className='mb-4 text-4xl font-bold text-gray-900 lg:text-5xl'>Kategoriler</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Geniş kategori yelpazemizde ihtiyacınız olan 3B modelleri keşfedin
          </p>
        </motion.div>

        {isLoading ? (
          <div className='flex min-h-[400px] items-center justify-center'>
            <div className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
              <p className='text-gray-600'>Kategoriler yükleniyor...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className='flex min-h-[200px] items-center justify-center'>
            <p className='text-gray-600'>Henüz kategori bulunmuyor</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className='mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4'
          >
            {categories.map((category, index) => (
              <Link key={category.id} href={`/kategori/${category.slug}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: 'easeOut',
                  }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.05,
                    y: -5,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`${category.size} group relative min-h-[200px] cursor-pointer overflow-hidden rounded-2xl lg:min-h-[250px]`}
                >
                  <div className='absolute inset-0'>
                    <img
                      src={category.image || '/images/categories/default.png'}
                      alt={category.name}
                      className='h-full w-full object-cover object-center'
                      onError={(e) => {
                        e.currentTarget.src = '/images/categories/default.png';
                      }}
                    />
                    <div className='absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/30' />
                  </div>

                  <div className='relative z-10 flex h-full flex-col items-center justify-center p-8 text-center'>
                    <h3 className='text-xl leading-tight font-bold text-white drop-shadow-lg lg:text-2xl'>
                      {category.name}
                    </h3>
                    <p className='mt-2 text-sm text-white/80 drop-shadow-lg'>
                      {category.productCount || 0} ürün
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Categories;
