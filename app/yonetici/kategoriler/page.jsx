'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, FolderTree, FolderOpen, X } from 'lucide-react';

const Modal = memo(({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={onClose}>
      <div className='w-full max-w-2xl rounded-xl bg-white shadow-xl' onClick={(e) => e.stopPropagation()}>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-xl font-bold text-gray-900'>{title}</h2>
          <button
            onClick={onClose}
            className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          >
            <X size={24} />
          </button>
        </div>
        <div className='p-6'>{children}</div>
      </div>
    </div>
  );
});
Modal.displayName = 'Modal';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const [formData, setFormData] = useState({
    name: '',
    image: null,
    imagePreview: null,
    parentId: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.ok) {
        setCategories(data.categories);
        setFlatCategories(data.flat || []);
      }
    } catch (error) {
      console.error('Load categories error:', error);
      alert('Kategoriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = useCallback(() => {
    setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
    setSelectedCategory(null);
    setShowAddModal(true);
  }, []);

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      image: null,
      imagePreview: category.image || null,
      parentId: category.parentId || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('useBunnyCDN', 'true'); // CDN yükleme aktif

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.ok) {
        setFormData((prev) => ({
          ...prev,
          image: data.url,
          imagePreview: data.url,
        }));
      } else {
        alert(data.error || 'Resim yüklenemedi');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Resim yüklenirken bir hata oluştu');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Lütfen kategori adı girin');
      return;
    }

    try {
      let url, method, body;

      if (selectedCategory) {
        url = `/api/admin/categories/${selectedCategory.id}`;
        method = 'PUT';
        body = {
          name: formData.name.trim(),
          image: formData.image || null,
        };
        if (formData.parentId !== selectedCategory.parentId) {
          body.parentId = formData.parentId || null;
        }
      } else {
        url = '/api/admin/categories';
        method = 'POST';
        body = {
          name: formData.name.trim(),
          image: formData.image || null,
          parentId: formData.parentId || null,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        alert(selectedCategory ? 'Kategori güncellendi!' : 'Kategori oluşturuldu!');
        setShowAddModal(false);
        setShowEditModal(false);
        setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
        setSelectedCategory(null);
        loadCategories();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${selectedCategory.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Kategori silindi!');
        setShowDeleteModal(false);
        setSelectedCategory(null);
        loadCategories();
      } else {
        alert(data.error || 'Silme başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const toggleExpand = useCallback((categoryId) => {
    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  }, []);

  const parentCategories = useMemo(() => {
    return flatCategories.filter((cat) => !cat.parentId);
  }, [flatCategories]);

  const editParentCategories = useMemo(() => {
    if (!selectedCategory) return parentCategories;
    return parentCategories.filter((cat) => cat.id !== selectedCategory.id);
  }, [parentCategories, selectedCategory]);

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
    setSelectedCategory(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedCategory(null);
  }, []);

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indent = level * 24;

    return (
      <div key={category.id} className='mb-2'>
        <div
          className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50'
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className='flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-700'
            >
              {isExpanded ? (
                <FolderOpen size={18} />
              ) : (
                <FolderTree size={18} />
              )}
            </button>
          ) : (
            <div className='h-6 w-6' />
          )}

          <div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100'>
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-gray-400'>
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          <div className='flex-1'>
            <div className='font-semibold text-gray-900'>{category.name}</div>
            <div className='flex items-center gap-4 text-sm text-gray-500'>
              <span>{category.productsCount || 0} ürün</span>
              {hasChildren && (
                <span>{category.childrenCount || category.children?.length || 0} alt kategori</span>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => handleEditCategory(category)}
              className='rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100'
              title='Düzenle'
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => handleDeleteCategory(category)}
              className='rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100'
              title='Sil'
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className='ml-6 mt-2'>
            {(category.children || []).map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Kategori Yönetimi</h1>
          <p className='mt-1 text-gray-600'>Kategorileri ve alt kategorileri yönetin</p>
        </div>
        <button
          onClick={handleAddCategory}
          className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Plus size={20} />
          Yeni Kategori
        </button>
      </div>

      <div className='rounded-xl bg-white p-6 shadow-sm'>
        {categories.length === 0 ? (
          <div className='py-12 text-center'>
            <FolderTree size={48} className='mx-auto mb-4 text-gray-400' />
            <p className='text-gray-600'>Henüz kategori eklenmemiş</p>
            <button
              onClick={handleAddCategory}
              className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              İlk Kategoriyi Ekle
            </button>
          </div>
        ) : (
          <div>{categories.map((cat) => renderCategory(cat))}</div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          show={true}
          onClose={handleCloseAddModal}
          title='Yeni Kategori Ekle'
        >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Kategori Adı *
            </label>
            <input
              key='category-name-input'
              type='text'
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, name: value }));
              }}
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              placeholder='Örn: Araçlar'
              autoComplete='off'
              required
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Üst Kategori (Opsiyonel)
            </label>
            <select
              key='parent-category-select'
              value={formData.parentId}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, parentId: value }));
              }}
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value=''>Ana Kategori (Üst kategori yok)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>Kategori Resmi</label>
            <div className='space-y-2'>
              {formData.imagePreview && (
                <div className='relative h-32 w-32 overflow-hidden rounded-lg border border-gray-200'>
                  <img
                    src={formData.imagePreview}
                    alt='Preview'
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <label className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50'>
                <ImageIcon size={20} className='text-gray-500' />
                <span className='text-sm text-gray-700'>
                  {formData.imagePreview ? 'Resmi Değiştir' : 'Resim Yükle'}
                </span>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </label>
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={() => {
                setShowAddModal(false);
                setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
              }}
              className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
            >
              İptal
            </button>
            <button
              type='submit'
              className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Oluştur
            </button>
          </div>
        </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          show={true}
          onClose={handleCloseEditModal}
          title='Kategori Düzenle'
        >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Kategori Adı *
            </label>
            <input
              key='edit-category-name-input'
              type='text'
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, name: value }));
              }}
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              autoComplete='off'
              required
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Üst Kategori (Opsiyonel)
            </label>
            <select
              key='edit-parent-category-select'
              value={formData.parentId}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, parentId: value }));
              }}
              className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            >
              <option value=''>Ana Kategori (Üst kategori yok)</option>
              {editParentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>Kategori Resmi</label>
            <div className='space-y-2'>
              {formData.imagePreview && (
                <div className='relative h-32 w-32 overflow-hidden rounded-lg border border-gray-200'>
                  <img
                    src={formData.imagePreview}
                    alt='Preview'
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              <label className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50'>
                <ImageIcon size={20} className='text-gray-500' />
                <span className='text-sm text-gray-700'>
                  {formData.imagePreview ? 'Resmi Değiştir' : 'Resim Yükle'}
                </span>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </label>
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={() => {
                setShowEditModal(false);
                setFormData({ name: '', image: null, imagePreview: null, parentId: '' });
                setSelectedCategory(null);
              }}
              className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
            >
              İptal
            </button>
            <button
              type='submit'
              className='rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Kaydet
            </button>
          </div>
        </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          show={true}
          onClose={handleCloseDeleteModal}
          title='Kategori Sil'
        >
        <div className='space-y-4'>
          <p className='text-gray-700'>
            <strong>{selectedCategory?.name}</strong> kategorisini silmek istediğinize emin
            misiniz?
          </p>
          {selectedCategory?.childrenCount > 0 && (
            <div className='rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800'>
              Bu kategorinin {selectedCategory.childrenCount} alt kategorisi var. Önce alt
              kategorileri silmeniz gerekir.
            </div>
          )}
          {selectedCategory && selectedCategory.productsCount > 0 && (
            <div className='rounded-lg bg-red-50 p-3 text-sm text-red-800'>
              Bu kategoride {selectedCategory.productsCount} ürün bulunuyor. Kategori
              silinemez.
            </div>
          )}
          <div className='flex justify-end gap-3 pt-4'>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
              }}
              className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
            >
              İptal
            </button>
            <button
              onClick={handleDelete}
              disabled={
                selectedCategory?.childrenCount > 0 || selectedCategory?.productsCount > 0
              }
              className='rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
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

export default AdminCategoriesPage;

