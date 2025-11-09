'use client';

import { useEffect, useState, memo } from 'react';
import { Plus, Edit2, Trash2, X, FileText, Eye, EyeOff } from 'lucide-react';

const Modal = memo(({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={onClose}>
      <div className='w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-xl font-bold text-gray-900'>{title}</h2>
          <button
            onClick={onClose}
            className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          >
            <X size={24} />
          </button>
        </div>
        <div className='p-6 overflow-y-auto flex-1'>{children}</div>
      </div>
    </div>
  );
});
Modal.displayName = 'Modal';

const AdminPagesPage = () => {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    type: 'FAQ',
    isActive: true,
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/pages');
      const data = await res.json();
      if (data.ok) {
        setPages(data.pages);
      }
    } catch (error) {
      console.error('Load pages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddPage = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      type: 'FAQ',
      isActive: true,
    });
    setSelectedPage(null);
    setShowAddModal(true);
  };

  const handleEditPage = (page) => {
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      type: page.type,
      isActive: page.isActive,
    });
    setSelectedPage(page);
    setShowEditModal(true);
  };

  const handleDeletePage = (page) => {
    setSelectedPage(page);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Lütfen başlık ve içerik girin');
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);

    try {
      let url, method;
      if (selectedPage) {
        url = `/api/pages/${selectedPage.slug}`;
        method = 'PUT';
      } else {
        url = '/api/admin/pages';
        method = 'POST';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: formData.title.trim(),
          content: formData.content.trim(),
          type: formData.type,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert(selectedPage ? 'Sayfa güncellendi!' : 'Sayfa oluşturuldu!');
        setShowAddModal(false);
        setShowEditModal(false);
        setFormData({
          slug: '',
          title: '',
          content: '',
          type: 'FAQ',
          isActive: true,
        });
        setSelectedPage(null);
        loadPages();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    try {
      const res = await fetch(`/api/pages/${selectedPage.slug}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Sayfa silindi!');
        setShowDeleteModal(false);
        setSelectedPage(null);
        loadPages();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      FAQ: 'SSS',
      CONTACT: 'Bize Ulaşın',
      TERMS: 'Kullanım Koşulları',
      PRIVACY: 'Gizlilik Politikası',
      LICENSE: 'Lisanslar Hakkında',
    };
    return labels[type] || type;
  };

  const getTypeSlug = (type) => {
    const slugs = {
      FAQ: 'sss',
      CONTACT: 'iletisim',
      TERMS: 'kullanim-kosullari',
      PRIVACY: 'gizlilik-politikasi',
      LICENSE: 'lisanslar-hakkinda',
    };
    return slugs[type] || type.toLowerCase();
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Sayfalar</h1>
          <p className='mt-1 text-sm text-gray-600'>İçerik sayfalarını yönetin</p>
        </div>
        <button
          onClick={handleAddPage}
          className='flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Plus size={20} />
          <span>Yeni Sayfa</span>
        </button>
      </div>

      <div className='rounded-xl bg-white p-6 shadow-sm'>
        {pages.length === 0 ? (
          <div className='py-12 text-center'>
            <FileText size={48} className='mx-auto mb-4 text-gray-400' />
            <p className='text-gray-600'>Henüz sayfa eklenmemiş</p>
            <button
              onClick={handleAddPage}
              className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              İlk Sayfayı Ekle
            </button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>Başlık</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>Tip</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>Slug</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>Durum</th>
                  <th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className='border-b border-gray-100 hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-900'>{page.title}</td>
                    <td className='px-4 py-3 text-sm text-gray-600'>{getTypeLabel(page.type)}</td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      <code className='rounded bg-gray-100 px-2 py-1 text-xs'>{page.slug}</code>
                    </td>
                    <td className='px-4 py-3'>
                      {page.isActive ? (
                        <span className='inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700'>
                          <Eye size={12} />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className='inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700'>
                          <EyeOff size={12} />
                          <span>Pasif</span>
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => handleEditPage(page)}
                          className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                          title='Düzenle'
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page)}
                          className='rounded-lg p-2 text-red-600 hover:bg-red-50'
                          title='Sil'
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <Modal
          show={true}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setFormData({
              slug: '',
              title: '',
              content: '',
              type: 'FAQ',
              isActive: true,
            });
            setSelectedPage(null);
          }}
          title={selectedPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle'}
        >
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Sayfa Tipi *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    type,
                    slug: prev.slug || generateSlug(getTypeSlug(type)),
                  }));
                }}
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              >
                <option value='FAQ'>SSS</option>
                <option value='CONTACT'>Bize Ulaşın</option>
                <option value='TERMS'>Kullanım Koşulları</option>
                <option value='PRIVACY'>Gizlilik Politikası</option>
                <option value='LICENSE'>Lisanslar Hakkında</option>
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Başlık *
              </label>
              <input
                type='text'
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    title,
                    slug: prev.slug || generateSlug(title),
                  }));
                }}
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                placeholder='Örn: Sık Sorulan Sorular'
                required
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Slug *
              </label>
              <input
                type='text'
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                placeholder='sss, iletisim, vb.'
                required
              />
              <p className='mt-1 text-xs text-gray-500'>
                URL'de kullanılacak benzersiz adres (örn: sss, kullanim-kosullari)
              </p>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                İçerik *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                rows={12}
                placeholder='Sayfa içeriğini buraya yazın...'
                required
              />
              <p className='mt-1 text-xs text-gray-500'>
                HTML etiketleri kullanabilirsiniz
              </p>
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='isActive'
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <label htmlFor='isActive' className='text-sm font-medium text-gray-700'>
                Aktif (Sayfa görünür)
              </label>
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <button
                type='button'
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFormData({
                    slug: '',
                    title: '',
                    content: '',
                    type: 'FAQ',
                    isActive: true,
                  });
                  setSelectedPage(null);
                }}
                className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
              >
                İptal
              </button>
              <button
                type='submit'
                className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
              >
                {selectedPage ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPage && (
        <Modal
          show={true}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPage(null);
          }}
          title='Sayfayı Sil'
        >
          <div className='space-y-4'>
            <p className='text-gray-700'>
              <strong>{selectedPage.title}</strong> sayfasını silmek istediğinize emin misiniz?
            </p>
            <p className='text-sm text-gray-500'>
              Bu işlem geri alınamaz.
            </p>
            <div className='flex justify-end gap-3 pt-4'>
              <button
                type='button'
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPage(null);
                }}
                className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
              >
                İptal
              </button>
              <button
                type='button'
                onClick={handleDelete}
                className='rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700'
              >
                Sil
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPagesPage;

