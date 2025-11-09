'use client';

import { useEffect, useState } from 'react';
import { Search, MessageSquare, Check, XCircle } from 'lucide-react';

const AdminSupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/support-tickets?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setTickets(data.tickets);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Load tickets error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`);
      const data = await res.json();
      if (data.ok) {
        setSelectedTicket(data.ticket);
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error('Load ticket details error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/admin/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await res.json();
      if (data.ok) {
        setNewMessage('');
        loadTicketDetails(selectedTicket.id);
        loadTickets();
      } else {
        alert(data.error || 'Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Bir hata oluştu');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.ok) {
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          loadTicketDetails(ticketId);
        }
      } else {
        alert(data.error || 'Durum güncellenemedi');
      }
    } catch (error) {
      console.error('Update status error:', error);
      alert('Bir hata oluştu');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'çözüldü':
        return 'bg-green-100 text-green-700';
      case 'açık':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Yüksek':
        return 'bg-red-100 text-red-700';
      case 'Orta':
        return 'bg-yellow-100 text-yellow-700';
      case 'Düşük':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Destek Talepleri</h1>
        <p className='mt-1 text-gray-600'>Toplam {total} destek talebi</p>
      </div>

      {/* Filtreler */}
      <div className='rounded-2xl bg-white p-6 shadow-lg'>
        <div className='grid gap-4 md:grid-cols-3'>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Durumlar</option>
            <option value='açık'>Açık</option>
            <option value='çözüldü'>Çözüldü</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Öncelikler</option>
            <option value='Yüksek'>Yüksek</option>
            <option value='Orta'>Orta</option>
            <option value='Düşük'>Düşük</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className='rounded-xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
          >
            <option value=''>Tüm Kategoriler</option>
            <option value='Teknik Destek'>Teknik Destek</option>
            <option value='Ödeme'>Ödeme</option>
            <option value='Hesap'>Hesap</option>
            <option value='Ürün'>Ürün</option>
            <option value='Genel'>Genel</option>
          </select>
        </div>
      </div>

      {/* Destek Talepleri Listesi */}
      <div className='rounded-2xl bg-white shadow-lg'>
        {isLoading ? (
          <div className='p-12 text-center'>
            <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-gray-600'>Yükleniyor...</p>
          </div>
        ) : tickets.length > 0 ? (
          <>
            <div className='space-y-3 p-6'>
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className='cursor-pointer rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md'
                  onClick={() => loadTicketDetails(ticket.id)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center space-x-3'>
                        <h3 className='font-semibold text-gray-900'>{ticket.subject}</h3>
                        <span className='text-sm text-gray-500'>#{ticket.id}</span>
                      </div>
                      <p className='mb-2 text-sm text-gray-600'>
                        {ticket.user.storeName || `${ticket.user.firstName} ${ticket.user.lastName}`} •{' '}
                        {ticket.user.email}
                      </p>
                      <p className='mb-3 text-sm text-gray-500'>{ticket.category}</p>
                      {ticket.messages && ticket.messages.length > 0 && (
                        <p className='text-xs text-gray-400'>
                          Son mesaj: {ticket.messages[0].message.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className='ml-4 flex flex-col items-end space-y-2'>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {ticket._count.messages || 0} mesaj
                      </span>
                      <span className='text-xs text-gray-400'>
                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
          <div className='p-12 text-center text-gray-500'>Destek talebi bulunamadı</div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
            setNewMessage('');
          }}
        >
          <div
            className='w-full max-w-3xl rounded-2xl bg-white shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='border-b border-gray-200 p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-gray-900'>{selectedTicket.subject}</h2>
                  <p className='text-sm text-gray-500'>
                    {selectedTicket.user.storeName || `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}`}{' '}
                    • {selectedTicket.user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTicketModal(false);
                    setSelectedTicket(null);
                    setNewMessage('');
                  }}
                  className='rounded-lg p-2 text-gray-400 hover:bg-gray-100'
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className='flex items-center space-x-3'>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedTicket.status)}`}
                >
                  {selectedTicket.status}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                    selectedTicket.priority
                  )}`}
                >
                  {selectedTicket.priority}
                </span>
                <span className='text-xs text-gray-500'>{selectedTicket.category}</span>
              </div>
            </div>

            <div className='max-h-[60vh] overflow-y-auto p-6'>
              <div className='space-y-4'>
                {selectedTicket.messages?.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`rounded-xl p-4 ${
                      message.sender === 'support'
                        ? 'ml-6 bg-blue-50'
                        : message.sender === 'user'
                          ? 'mr-6 bg-gray-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-gray-900'>
                        {message.sender === 'support'
                          ? 'Destek Ekibi'
                          : message.user
                            ? `${message.user.firstName} ${message.user.lastName}`
                            : 'Kullanıcı'}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {new Date(message.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className='text-sm text-gray-700'>{message.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedTicket.status !== 'çözüldü' && (
              <div className='border-t border-gray-200 p-6'>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder='Yanıtınızı yazın...'
                  rows={3}
                  className='mb-3 w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                />
                <div className='flex items-center justify-between'>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'çözüldü')}
                    className='flex items-center space-x-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700'
                  >
                    <Check size={18} />
                    <span>Çözüldü Olarak İşaretle</span>
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className='rounded-xl bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSendingMessage ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTicketsPage;

