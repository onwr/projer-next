'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft, ShoppingCart, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

const PaymentPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state) => state.cart);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paytrToken, setPaytrToken] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userName: '',
    userPhone: '',
    userEmail: '',
    userAddress: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/giris');
      return;
    }
    if (items.length === 0 && !showIframe) {
      router.push('/');
      return;
    }

    if (session.user) {
      setUserInfo({
        userName: session.user.name || '',
        userEmail: session.user.email || '',
        userPhone: '',
        userAddress: '',
      });
    }
  }, [session, items, router, showIframe]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const createOrderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
        }),
      });

      const orderData = await createOrderRes.json();
      if (!orderData.ok) {
        throw new Error(orderData.error || 'Sipariş oluşturulamadı');
      }

      const orderIdPrefix = orderData.orderIdPrefix || orderData.orders[0]?.id;
      const merchantOid = `${orderIdPrefix}${Date.now()}`;

      let userIp = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
      } catch (err) {
        console.warn('IP alınamadı:', err);
      }

      const paymentRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          merchantOid,
          userName: userInfo.userName,
          userPhone: userInfo.userPhone,
          userEmail: userInfo.userEmail,
          userAddress: userInfo.userAddress,
          userIp,
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentData.ok) {
        const errorMsg = paymentData.error || 'Ödeme başlatılamadı';
        console.error('Payment error:', errorMsg);
        throw new Error(errorMsg);
      }

      setPaytrToken(paymentData.token);
      setShowIframe(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Payment error details:', err);
      const errorMessage = err.message || 'Bir hata oluştu';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!session || (items.length === 0 && !showIframe)) {
    return null;
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-gray-100 py-8'>
      <div className='container mx-auto max-w-6xl px-4'>
        {!showIframe && (
          <Link
            href='/'
            className='mb-6 inline-flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900'
          >
            <ArrowLeft size={20} />
            <span>Ana Sayfaya Dön</span>
          </Link>
        )}

        <AnimatePresence mode='wait'>
          {showIframe && paytrToken ? (
            <motion.div
              key='iframe'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='relative mx-4 h-[90vh] w-full max-w-5xl rounded-2xl bg-white shadow-2xl'
              >
                <div className='flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4'>
                  <h2 className='text-lg font-semibold text-white'>Güvenli Ödeme</h2>
                  <button
                    onClick={() => setShowIframe(false)}
                    className='rounded-lg p-2 text-white transition-colors hover:bg-white/20'
                    aria-label='Kapat'
                  >
                    <X size={20} />
                  </button>
                </div>
                <iframe
                  id='paytr-iframe'
                  src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
                  className='h-[calc(90vh-80px)] w-full rounded-b-2xl'
                  title='PayTR Ödeme'
                  allow='payment'
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key='form'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='grid gap-8 lg:grid-cols-3'
            >
              <div className='lg:col-span-2'>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='rounded-2xl bg-white p-8 shadow-xl'
                >
                  <div className='mb-6 flex items-center space-x-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg'>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h1 className='text-2xl font-bold text-gray-900'>Ödeme Bilgileri</h1>
                      <p className='text-sm text-gray-500'>Güvenli ödeme için bilgilerinizi giriniz</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='grid gap-6 sm:grid-cols-2'>
                      <div className='sm:col-span-2'>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          Ad Soyad <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='text'
                          name='userName'
                          value={userInfo.userName}
                          onChange={handleInputChange}
                          required
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
                          placeholder='Adınız ve soyadınız'
                        />
                      </div>

                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          E-posta <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='email'
                          name='userEmail'
                          value={userInfo.userEmail}
                          onChange={handleInputChange}
                          required
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
                          placeholder='ornek@email.com'
                        />
                      </div>

                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          Telefon <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='tel'
                          name='userPhone'
                          value={userInfo.userPhone}
                          onChange={handleInputChange}
                          required
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
                          placeholder='05XX XXX XX XX'
                        />
                      </div>

                      <div className='sm:col-span-2'>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>Adres</label>
                        <textarea
                          name='userAddress'
                          value={userInfo.userAddress}
                          onChange={handleInputChange}
                          rows={3}
                          className='w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none'
                          placeholder='Adres bilgisi (opsiyonel)'
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700'
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.button
                      type='submit'
                      disabled={isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className='flex w-full items-center justify-center space-x-3 rounded-xl bg-linear-to-r from-blue-600 via-blue-600 to-blue-700 py-4 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className='animate-spin' size={20} />
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} />
                          <span>Ödemeyi Tamamla</span>
                          <Lock size={20} />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </div>

              <div className='lg:col-span-1'>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='sticky top-24 rounded-2xl bg-white p-6 shadow-xl'
                >
                  <h2 className='mb-4 flex items-center space-x-2 text-lg font-semibold text-gray-900'>
                    <ShoppingCart size={20} className='text-blue-600' />
                    <span>Sipariş Özeti</span>
                  </h2>

                  <div className='space-y-4 border-b border-gray-200 pb-4'>
                    {items.map((item) => (
                      <div key={item.id} className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-gray-900 truncate'>{item.title}</p>
                          <p className='text-sm text-gray-500'>
                            {item.quantity} adet × ₺{parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <span className='font-semibold text-gray-900 whitespace-nowrap'>
                          ₺{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='mt-6'>
                    <div className='flex items-center justify-between border-t border-gray-200 pt-4 text-xl font-bold text-gray-900'>
                      <span>Toplam</span>
                      <span className='text-2xl bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent'>
                        ₺{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentPage;
