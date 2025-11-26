'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const router = useRouter();
  const { data: session, status } = useSession();

  const getDashboardRoute = (userType) => {
    if (userType === 'ADMIN') return '/yonetici';
    if (userType === 'STORE') return '/magaza-paneli';
    if (userType === 'USER') return '/kullanici-paneli';
    return '/';
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(getDashboardRoute(session.user.userType));
    }
  }, [status, session, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Geçersiz email veya şifre');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='border-b bg-white shadow-sm'>
        <div className='container mx-auto max-w-7xl px-4 py-4'>
          <div className='flex items-center justify-center'>
            <Link href='/' className='flex items-center space-x-3'>
              <img src='/logo.svg' alt='PROJER.com' />
            </Link>
          </div>
        </div>
      </div>

      <div className='container mx-auto max-w-2xl px-4 py-12'>
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='overflow-hidden rounded-2xl bg-white shadow-xl'
        >
          {/* Header */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-center text-white'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            >
              <div className='mb-4 inline-block rounded-2xl bg-white/90 p-4 backdrop-blur-sm'>
                <img src='/logo.svg' alt='PROJER.com' />
              </div>
              <h1 className='mb-2 text-3xl font-bold'>Hoş Geldiniz</h1>
              <p className='text-blue-100'>Hesabınıza giriş yapın</p>
            </motion.div>
          </div>

          {/* Login Form */}
          <div className='p-8'>
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              className='space-y-6'
            >
              {/* Email Input */}
              <div>
                <label className='mb-2 block text-sm font-semibold text-gray-700'>
                  E-posta Adresi
                </label>
                <div className='relative'>
                  <Mail
                    className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                    size={20}
                  />
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500'
                    placeholder='ornek@email.com'
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className='mb-2 block text-sm font-semibold text-gray-700'>Şifre</label>
                <div className='relative'>
                  <Lock
                    className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                    size={20}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={formData.password}
                    onChange={handleInputChange}
                    className='w-full rounded-xl border border-gray-200 py-3 pr-12 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500'
                    placeholder='••••••••'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors duration-200 hover:text-gray-600'
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex items-center space-x-2 rounded-xl bg-red-50 p-3 text-red-600'
                >
                  <AlertCircle size={20} />
                  <span className='text-sm font-medium'>{error}</span>
                </motion.div>
              )}

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type='submit'
                disabled={loading}
                className={`w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all duration-200 ${
                  loading
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    <span>Giriş yapılıyor...</span>
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </motion.button>
            </motion.form>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
              className='mt-6 text-center'
            >
              <p className='text-gray-600'>
                Hesabınız yok mu?{' '}
                <Link
                  href='/kayit'
                  className='font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700'
                >
                  Kayıt Ol
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
