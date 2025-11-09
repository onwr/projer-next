'use client';

import { useEffect, useState } from 'react';
import { Search, Edit, Trash2, Eye, Filter, Download } from 'lucide-react';
import Link from 'next/link';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: '',
  });

  useEffect(() => {
    loadUsers();
  }, [page, search, userTypeFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (userTypeFilter) params.set('userType', userTypeFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      userType: user.userType,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Kullanıcı güncellendi!');
        setShowEditModal(false);
        loadUsers();
      } else {
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        alert('Kullanıcı silindi!');
        loadUsers();
      } else {
        alert(data.error || 'Silme başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = async () => {
    try {
      const allUsers = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: '100',
          sortBy,
          sortOrder,
        });
        if (search) params.set('search', search);
        if (userTypeFilter) params.set('userType', userTypeFilter);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();

        if (data.ok && data.users.length > 0) {
          allUsers.push(...data.users);
          if (data.users.length < 100) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      const csvHeaders = [
        'ID',
        'Ad',
        'Soyad',
        'Email',
        'Telefon',
        'Kullanıcı Tipi',
        'Mağaza Adı',
        'Ürün Sayısı',
        'Sipariş Sayısı',
        'Aktif Bakiye',
        'Toplam Kazanç',
        'Kayıt Tarihi',
      ];

      const csvRows = allUsers.map((user) => [
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.phone || '',
        user.userType === 'ADMIN' ? 'Admin' : user.userType === 'STORE' ? 'Mağaza' : 'Kullanıcı',
        user.storeName || '',
        user._count?.products || 0,
        user._count?.orders || 0,
        user.balance?.activeBalance?.toFixed(2) || '0.00',
        user.balance?.totalEarnings?.toFixed(2) || '0.00',
        new Date(user.createdAt).toLocaleDateString('tr-TR'),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kullanicilar_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${allUsers.length} kullanıcı CSV olarak indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export işlemi sırasında bir hata oluştu');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Kullanıcı Yönetimi</h1>
          <p className='mt-1 text-gray-600'>Toplam {total} kullanıcı</p>
        </div>
        <button
          onClick={handleExport}
          className='flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Ara (isim, email, mağaza)'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Tipler</option>
            <option value='USER'>Kullanıcı</option>
            <option value='STORE'>Mağaza</option>
            <option value='ADMIN'>Admin</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value='createdAt-desc'>Yeni → Eski</option>
            <option value='createdAt-asc'>Eski → Yeni</option>
            <option value='firstName-asc'>İsim (A-Z)</option>
            <option value='firstName-desc'>İsim (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : users.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-gray-200 bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Kullanıcı</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Tip</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Ürün/Sipariş</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Bakiye</th>
                    <th className='px-6 py-3 text-left text-sm font-semibold text-gray-700'>Kayıt</th>
                    <th className='px-6 py-3 text-right text-sm font-semibold text-gray-700'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-4'>
                        <div className='flex items-center space-x-3'>
                          <div className='h-10 w-10 overflow-hidden rounded-full bg-gray-200'>
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.firstName}
                                className='h-full w-full object-cover'
                                onError={(e) => (e.currentTarget.src = '/logo.svg')}
                              />
                            ) : (
                              <div className='flex h-full w-full items-center justify-center text-gray-400'>
                                {user.firstName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className='font-semibold text-gray-900'>
                              {user.firstName} {user.lastName}
                            </p>
                            <p className='text-sm text-gray-500'>{user.email}</p>
                            {user.storeName && (
                              <p className='text-xs text-blue-600'>{user.storeName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            user.userType === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : user.userType === 'STORE'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.userType === 'ADMIN' ? 'Admin' : user.userType === 'STORE' ? 'Mağaza' : 'Kullanıcı'}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        <div>
                          <span className='font-medium'>{user._count.products || 0}</span> ürün
                        </div>
                        <div>
                          <span className='font-medium'>{user._count.orders || 0}</span> sipariş
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {user.balance ? (
                          <div>
                            <div>₺{user.balance.activeBalance.toFixed(2)}</div>
                            <div className='text-xs text-gray-400'>
                              Toplam: ₺{user.balance.totalEarnings.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button
                            onClick={() => handleEdit(user)}
                            className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'
                            title='Düzenle'
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='border-t border-gray-200 px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    Sayfa {page} / {totalPages}
                  </p>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className='rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50'
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className='rounded-xl border border-gray-300 px-4 py-2 text-sm disabled:opacity-50'
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='p-12 text-center text-gray-500'>Kullanıcı bulunamadı</div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setShowEditModal(false)}
        >
          <div
            className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className='mb-4 text-xl font-bold text-gray-900'>Kullanıcı Düzenle</h2>
            <form onSubmit={handleUpdate} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Ad</label>
                <input
                  type='text'
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Soyad</label>
                <input
                  type='text'
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Email</label>
                <input
                  type='email'
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Telefon</label>
                <input
                  type='tel'
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Kullanıcı Tipi</label>
                <select
                  value={editForm.userType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, userType: e.target.value }))}
                  className='w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  required
                >
                  <option value='USER'>Kullanıcı</option>
                  <option value='STORE'>Mağaza</option>
                  <option value='ADMIN'>Admin</option>
                </select>
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  className='flex-1 rounded-xl border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50'
                >
                  İptal
                </button>
                <button
                  type='submit'
                  className='flex-1 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700'
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

