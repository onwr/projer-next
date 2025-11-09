'use client';

import { useState } from 'react';
import { Save, Settings } from 'lucide-react';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    siteName: 'PROJER.com',
    siteDescription: '3D Model Market',
    siteLogo: '/logo.svg',
    paytrMerchantId: '',
    paytrMerchantKey: '',
    paytrMerchantSalt: '',
    paytrTestMode: '1',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: API endpoint'i oluştur
      alert('Ayarlar kaydedildi! (Yakında aktif olacak)');
    } catch (error) {
      console.error('Save settings error:', error);
      alert('Ayarlar kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Sistem Ayarları</h1>
        <p className='mt-1 text-gray-600'>Site genel ayarları</p>
      </div>

      {/* Genel Ayarlar */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <h2 className='mb-4 flex items-center space-x-2 text-xl font-semibold text-gray-900'>
          <Settings size={24} />
          <span>Genel Ayarlar</span>
        </h2>
        <div className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Site Adı</label>
            <input
              type='text'
              value={settings.siteName}
              onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Site Açıklaması</label>
            <input
              type='text'
              value={settings.siteDescription}
              onChange={(e) => setSettings((prev) => ({ ...prev, siteDescription: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
        </div>
      </div>

      {/* PayTR Ayarları */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <h2 className='mb-4 text-xl font-semibold text-gray-900'>PayTR Ödeme Ayarları</h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Merchant ID</label>
            <input
              type='text'
              value={settings.paytrMerchantId}
              onChange={(e) => setSettings((prev) => ({ ...prev, paytrMerchantId: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Merchant Key</label>
            <input
              type='password'
              value={settings.paytrMerchantKey}
              onChange={(e) => setSettings((prev) => ({ ...prev, paytrMerchantKey: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Merchant Salt</label>
            <input
              type='password'
              value={settings.paytrMerchantSalt}
              onChange={(e) => setSettings((prev) => ({ ...prev, paytrMerchantSalt: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Test Modu</label>
            <select
              value={settings.paytrTestMode}
              onChange={(e) => setSettings((prev) => ({ ...prev, paytrTestMode: e.target.value }))}
              className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value='1'>Aktif</option>
              <option value='0'>Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50'
        >
          <Save size={20} />
          <span>{isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

