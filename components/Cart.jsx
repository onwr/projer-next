'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, CreditCard, ArrowRight } from 'lucide-react';
import { removeFromCart, clearCart, closeCart } from '@/store/cartSlice';
import { useSession } from 'next-auth/react';

const Cart = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, isOpen, totalPrice, totalItems } = useSelector((state) => state.cart);
  const { data: session } = useSession();

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };


  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleCheckout = () => {
    if (!session) {
      router.push('/giris');
      dispatch(closeCart());
      return;
    }
    if (items.length === 0) {
      return;
    }
    dispatch(closeCart());
    router.push('/odeme');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 bg-black/50'
            onClick={() => dispatch(closeCart())}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed top-0 right-0 z-50 h-full w-full min-w-[400px] bg-white shadow-2xl sm:w-1/4'
          >
            <div className='flex h-full flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-gray-200 p-6'>
                <div className='flex items-center space-x-3'>
                  <ShoppingCart size={24} className='text-blue-600' />
                  <h2 className='text-xl font-bold text-gray-900'>Sepetim</h2>
                  <span className='rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white'>
                    {totalItems}
                  </span>
                </div>
                <button
                  onClick={() => dispatch(closeCart())}
                  className='rounded-full p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600'
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cart Items */}
              <div className='flex-1 overflow-y-auto p-6'>
                {items.length === 0 ? (
                  <div className='flex h-full flex-col items-center justify-center text-center'>
                    <ShoppingCart size={64} className='text-gray-300' />
                    <h3 className='mt-4 text-lg font-semibold text-gray-900'>Sepetiniz boş</h3>
                    <p className='mt-2 text-gray-500'>
                      Alışverişe devam etmek için ürünleri sepete ekleyin
                    </p>
                    <Link
                      href='/'
                      onClick={() => dispatch(closeCart())}
                      className='mt-4 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700'
                    >
                      Alışverişe Devam Et
                    </Link>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className='flex items-center space-x-4 rounded-xl border border-gray-200 p-4'
                      >
                        {/* Product Image */}
                        <div className='h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-gray-100 to-gray-200'>
                          <img
                            src={item.image || item.coverImage || '/logo.svg'}
                            alt={item.title}
                            className='h-full w-full object-cover object-center'
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/logo.svg';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className='min-w-0 flex-1'>
                          <h3 className='truncate font-semibold text-gray-900'>{item.title}</h3>
                          <p className='text-sm text-gray-500'>{item.category}</p>
                          <div className='mt-1 flex items-center space-x-2'>
                            <span className='font-bold text-blue-600'>₺{parseFloat(item.price || 0).toFixed(2)}</span>
                            {item.originalPrice && (
                              <span className='text-sm text-gray-500 line-through'>
                                ₺{parseFloat(item.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className='shrink-0 rounded-full p-2 text-red-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600'
                        >
                          <Trash2 size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className='border-t border-gray-200 p-6'>
                  {/* Total */}
                  <div className='mb-4 flex items-center justify-between'>
                    <span className='text-lg font-semibold text-gray-900'>Toplam:</span>
                    <span className='text-2xl font-bold text-blue-600'>
                      ₺{totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Clear Cart Button */}
                  <button
                    onClick={handleClearCart}
                    className='mb-4 w-full rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-600 transition-colors duration-200 hover:bg-red-100'
                  >
                    Sepeti Temizle
                  </button>

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className='flex w-full items-center justify-center space-x-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800'
                  >
                    <CreditCard size={20} />
                    <span>Ödemeye Geç</span>
                    <ArrowRight size={20} />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
