'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  ArrowLeft,
  Check,
  ArrowRight,
  Phone,
  Camera,
  Upload,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Register = () => {
  const [userType, setUserType] = useState('user');
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeDescription: '',
    phone: '',
    profileImage: null,
    acceptTerms: false,
  });

  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
    if (error) setError('');
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('useBunnyCDN', 'true'); // CDN yükleme aktif

    const response = await fetch('/api/upload?public=true', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Resim yüklenemedi');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      setError('Kullanım şartlarını kabul etmelisiniz');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setError('');
      setLoading(true);

      let profileImageUrl = null;
      if (userType === 'store' && formData.profileImage) {
        profileImageUrl = await uploadImage(formData.profileImage);
      }

      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType: userType,
        ...(userType === 'store' && {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription,
          phone: formData.phone,
          profileImage: profileImageUrl,
        }),
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt olurken bir hata oluştu');
      }

      router.push('/giris?registered=true');
    } catch (error) {
      console.error('Register error:', error);
      if (error.message.includes('email')) {
        setError('Bu e-posta adresi zaten kullanımda');
      } else {
        setError(error.message || 'Kayıt olurken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTotalSteps = () => {
    return userType === 'store' ? 3 : 2;
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.password &&
          formData.confirmPassword
        );
      case 2:
        if (userType === 'store') {
          return formData.storeName && formData.storeDescription && formData.phone;
        }
        return true;
      case 3:
        return formData.acceptTerms;
      default:
        return false;
    }
  };

  const userTypeOptions = [
    {
      id: 'user',
      title: 'Kullanıcı',
      description: '3B modelleri satın almak için',
      icon: User,
      color: 'blue',
    },
    {
      id: 'store',
      title: 'Mağaza',
      description: '3B modelleri satmak için',
      icon: Building,
      color: 'green',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Kişisel Bilgiler',
      description: 'Temel bilgilerinizi girin',
      icon: User,
    },
    ...(userType === 'store'
      ? [
          {
            number: 2,
            title: 'Mağaza Bilgileri',
            description: 'Mağaza detaylarınızı girin',
            icon: Building,
          },
        ]
      : []),
    {
      number: userType === 'store' ? 3 : 2,
      title: 'Sözleşme',
      description: 'Kullanım şartlarını onaylayın',
      icon: Check,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='border-b bg-white shadow-sm'>
        <div className='container mx-auto max-w-7xl px-4 py-4'>
          <div className='flex items-center justify-center'>
            <Link href='/' className='flex items-center space-x-3'>
              <img src='/logo.svg' alt='PROJER.com' />
            </Link>
          </div>
        </div>
      </div>

      <div className='container mx-auto max-w-4xl px-4 py-12'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='mb-12'
        >
          <div className='flex items-center justify-center space-x-8'>
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const Icon = step.icon;

              return (
                <div key={step.number} className='flex items-center'>
                  <div className='flex flex-col items-center'>
                    <motion.div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : isCompleted
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 bg-white text-gray-400'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </motion.div>
                    <div className='mt-2 text-center'>
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-blue-600'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className='text-xs text-gray-500'>{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 h-0.5 w-16 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 flex items-center space-x-2 rounded-xl bg-red-50 p-3 text-red-600'
          >
            <AlertCircle size={20} />
            <span className='text-sm font-medium'>{error}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='overflow-hidden rounded-2xl bg-white shadow-xl'
        >
          <AnimatePresence mode='wait'>
            {currentStep === 1 && (
              <motion.div
                key='step1'
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className='p-8'
              >
                <div className='mb-8'>
                  <h2 className='mb-6 text-2xl font-bold text-gray-900'>Hesap Türü Seçin</h2>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {userTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = userType === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setUserType(option.id)}
                          className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                            isSelected
                              ? option.id === 'user'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className='absolute top-3 right-3'
                            >
                              <div
                                className={`h-6 w-6 rounded-full ${
                                  option.id === 'user' ? 'bg-blue-500' : 'bg-green-500'
                                } flex items-center justify-center`}
                              >
                                <Check size={16} className='text-white' />
                              </div>
                            </motion.div>
                          )}
                          <div className='text-left'>
                            <div
                              className={`mb-4 inline-flex rounded-lg p-3 ${
                                isSelected
                                  ? option.id === 'user'
                                    ? 'bg-blue-100'
                                    : 'bg-green-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <Icon
                                size={24}
                                className={`${
                                  isSelected
                                    ? option.id === 'user'
                                      ? 'text-blue-600'
                                      : 'text-green-600'
                                    : 'text-gray-600'
                                }`}
                              />
                            </div>
                            <h4
                              className={`mb-2 text-lg font-semibold ${
                                isSelected
                                  ? option.id === 'user'
                                    ? 'text-blue-900'
                                    : 'text-green-900'
                                  : 'text-gray-900'
                              }`}
                            >
                              {option.title}
                            </h4>
                            <p className='text-sm text-gray-600'>{option.description}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={(e) => e.preventDefault()}>
                  <h3 className='mb-6 text-xl font-semibold text-gray-900'>Kişisel Bilgiler</h3>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>Ad</label>
                        <div className='relative'>
                          <User
                            className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                            size={20}
                          />
                          <input
                            type='text'
                            name='firstName'
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500'
                            placeholder='Adınız'
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          Soyad
                        </label>
                        <div className='relative'>
                          <User
                            className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                            size={20}
                          />
                          <input
                            type='text'
                            name='lastName'
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500'
                            placeholder='Soyadınız'
                            required
                          />
                        </div>
                      </div>
                    </div>

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
                          className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500'
                          placeholder='ornek@email.com'
                          required
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          Şifre
                        </label>
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
                      <div>
                        <label className='mb-2 block text-sm font-semibold text-gray-700'>
                          Şifre Tekrar
                        </label>
                        <div className='relative'>
                          <Lock
                            className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                            size={20}
                          />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name='confirmPassword'
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className='w-full rounded-xl border border-gray-200 py-3 pr-12 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500'
                            placeholder='••••••••'
                            required
                          />
                          <button
                            type='button'
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className='absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors duration-200 hover:text-gray-600'
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {currentStep === 2 && userType === 'store' && (
              <motion.div
                key='step2'
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className='p-8'
              >
                <form onSubmit={(e) => e.preventDefault()}>
                  <h2 className='mb-6 text-2xl font-bold text-gray-900'>Mağaza Bilgileri</h2>
                  <div className='space-y-6'>
                    <div>
                      <label className='mb-2 block text-sm font-semibold text-gray-700'>
                        Mağaza Adı
                      </label>
                      <div className='relative'>
                        <Building
                          className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                          size={20}
                        />
                        <input
                          type='text'
                          name='storeName'
                          value={formData.storeName}
                          onChange={handleInputChange}
                          className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-green-500'
                          placeholder='Mağaza adınız'
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className='mb-2 block text-sm font-semibold text-gray-700'>
                        Mağaza Açıklaması
                      </label>
                      <textarea
                        name='storeDescription'
                        value={formData.storeDescription}
                        onChange={handleInputChange}
                        rows={4}
                        className='w-full resize-none rounded-xl border border-gray-200 px-4 py-3 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-green-500'
                        placeholder='Mağazanız hakkında detaylı bir açıklama yazın...'
                        required
                      />
                    </div>

                    <div>
                      <label className='mb-2 block text-sm font-semibold text-gray-700'>
                        Telefon Numarası
                      </label>
                      <div className='relative'>
                        <Phone
                          className='absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400'
                          size={20}
                        />
                        <input
                          type='tel'
                          name='phone'
                          value={formData.phone}
                          onChange={handleInputChange}
                          className='w-full rounded-xl border border-gray-200 py-3 pr-4 pl-10 transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-green-500'
                          placeholder='+90 (5XX) XXX XX XX'
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className='mb-2 block text-sm font-semibold text-gray-700'>
                        Mağaza Profil Fotoğrafı
                      </label>
                      <div className='flex items-center space-x-6'>
                        <div className='flex-shrink-0'>
                          {formData.profileImage ? (
                            <div className='relative'>
                              <img
                                src={URL.createObjectURL(formData.profileImage)}
                                alt='Profil önizleme'
                                className='h-24 w-24 rounded-xl border-2 border-gray-200 object-cover'
                              />
                              <button
                                type='button'
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, profileImage: null }))
                                }
                                className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors duration-200 hover:bg-red-600'
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className='flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50'>
                              <Camera className='h-8 w-8 text-gray-400' />
                            </div>
                          )}
                        </div>

                        <div className='flex-1'>
                          <label className='cursor-pointer'>
                            <input
                              type='file'
                              name='profileImage'
                              onChange={handleInputChange}
                              accept='image/*'
                              className='hidden'
                            />
                            <div className='flex items-center space-x-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-all duration-200 hover:border-green-400 hover:bg-green-50'>
                              <Upload className='h-5 w-5 text-gray-400' />
                              <div>
                                <p className='text-sm font-medium text-gray-700'>
                                  {formData.profileImage ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                                </p>
                                <p className='text-xs text-gray-500'>JPG, PNG veya GIF (Max 5MB)</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {currentStep === (userType === 'store' ? 3 : 2) && (
              <motion.div
                key='step3'
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className='p-8'
              >
                <form onSubmit={handleSubmit}>
                  <h2 className='mb-6 text-2xl font-bold text-gray-900'>Sözleşme ve Koşullar</h2>
                  <div className='space-y-6'>
                    <div className='rounded-xl border border-gray-200 p-6'>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                        Kullanım Şartları
                      </h3>
                      <div className='max-h-64 space-y-3 overflow-y-auto text-sm text-gray-600'>
                        <p>
                          Bu sözleşme, PROJER.com platformunu kullanarak 3B model شارşı yapmak
                          isteyen mağaza sahipleri ile platform arasındaki hak ve yükümlülükleri
                          düzenler.
                        </p>
                        <p>
                          <strong>1. Genel Hükümler:</strong> Mağaza sahibi olarak platformumuzu
                          kullanarak 3B modellerinizi satabilir, müşterilerinizle iletişim kurabilir
                          ve satış işlemlerinizi yönetebilirsiniz.
                        </p>
                        <p>
                          <strong>2. Yükümlülükler:</strong> Satışa sunduğunuz tüm 3B modellerin
                          orijinal olduğunu, telif hakkı ihlali içermediğini ve kaliteli olduğunu
                          garanti etmelisiniz.
                        </p>
                        <p>
                          <strong>3. Komisyon:</strong> Platform üzerinden yapılan her satıştan %10
                          komisyon alınmaktadır.
                        </p>
                        <p>
                          <strong>4. Ödeme:</strong> Satış gelirleriniz aylık olarak hesabınıza
                          aktarılacaktır.
                        </p>
                      </div>
                    </div>

                    <div className='rounded-xl border border-gray-200 p-6'>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                        Gizlilik Politikası
                      </h3>
                      <div className='max-h-64 space-y-3 overflow-y-auto text-sm text-gray-600'>
                        <p>
                          Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu
                          kapsamında işlenmektedir.
                        </p>
                        <p>
                          <strong>Toplanan Veriler:</strong> Ad, soyad, e-posta, telefon, adres ve
                          mağaza bilgileriniz.
                        </p>
                        <p>
                          <strong>Kullanım Amacı:</strong> Hesap yönetimi, satış işlemleri ve
                          müşteri hizmetleri.
                        </p>
                        <p>
                          <strong>Paylaşım:</strong> Verileriniz üçüncü taraflarla paylaşılmaz.
                        </p>
                      </div>
                    </div>

                    <div className='flex items-start space-x-3'>
                      <input
                        type='checkbox'
                        name='acceptTerms'
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        className='mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        required
                      />
                      <label className='text-sm text-gray-600'>
                        <Link
                          href='/terms'
                          className='font-medium text-blue-600 hover:text-blue-700'
                        >
                          Kullanım Şartları
                        </Link>{' '}
                        ve{' '}
                        <Link
                          href='/privacy'
                          className='font-medium text-blue-600 hover:text-blue-700'
                        >
                          Gizlilik Politikası
                        </Link>
                        'nı okudum ve kabul ediyorum.
                      </label>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='border-t bg-gray-50 px-8 py-6'>
            <div className='flex items-center justify-between'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 rounded-xl px-6 py-3 font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'cursor-not-allowed text-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <ArrowLeft size={20} />
                <span>Geri</span>
              </motion.button>

              <div className='flex items-center space-x-2'>
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${
                      currentStep === index + 1
                        ? 'w-8 bg-blue-600'
                        : currentStep > index + 1
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep < getTotalSteps() ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className={`flex items-center space-x-2 rounded-xl px-6 py-3 font-medium transition-all duration-200 ${
                    isStepValid(currentStep)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
                >
                  <span>İleri</span>
                  <ArrowRight size={20} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  onClick={handleSubmit}
                  disabled={!isStepValid(currentStep) || loading}
                  className={`flex items-center space-x-2 rounded-xl px-8 py-3 font-semibold transition-all duration-200 ${
                    isStepValid(currentStep) && !loading
                      ? userType === 'user'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                      <span>Kayıt Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <span>{userType === 'user' ? 'Kayıt Ol' : 'Mağaza Oluştur'}</span>
                      <Check size={20} />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
