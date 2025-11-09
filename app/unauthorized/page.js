export default function Unauthorized() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='max-w-md rounded-lg bg-white p-8 text-center shadow-lg'>
        <h1 className='mb-4 text-3xl font-bold text-red-600'>Yetkisiz Erişim</h1>
        <p className='mb-6 text-gray-600'>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        <a
          href='/'
          className='inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700'
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
