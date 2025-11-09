'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  Package,
  Loader2,
  ArrowLeft,
  XCircle,
  Rocket,
  Image as ImageIcon,
  Tag as TagIcon,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Orijinal kodda buradaki ActionBar import'u çakışmaya neden oluyordu.
// Yeni versiyonda, güncel ActionBar'ı bu dosya içinde tanımlayarak import çakışmasını önlüyoruz.
// import ActionBar from '@/components/ui/ActionBar'; // BU SATIRI SİLMENİZ GEREKİR (veya yerine koyduğum kodu kullanın)

import Wizard from '@/components/ui/Wizard';
import Dropzone from '@/components/ui/Dropzone';
import TagInput from '@/components/ui/TagInput';
import SelectGroup from '@/components/ui/SelectGroup';
import PriceSection from '@/components/ui/PriceSection';
import PreviewCard from '@/components/ui/PreviewCard';

// --- Sabit Veriler ve Animasyon Değişkenleri (Aynı Kaldı) ---

const licenses = [
  'Royalty free, no AI',
  'Royalty free, AI allowed',
  'Commercial use',
  'Personal use only',
];

const contentVariants = {
  enter: {
    opacity: 0,
    x: 20,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  center: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const errorVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 16,
    marginBottom: 16,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.3 } },
};

// --- Framer Motion'lı Yeni ActionBar Bileşeni (Çakışmayı önlemek için buraya taşıdık) ---
const CustomActionBar = ({ onCancel, onPublish, isLoading, currentStep, totalSteps }) => {
  const isFinalStep = currentStep === totalSteps;

  const getButtonClass = (isActive = true) =>
    `px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
      isActive
        ? 'bg-gray-600 text-white hover:bg-gray-700 shadow-md shadow-gray-200'
        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
    }`;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className='fixed right-0 bottom-0 left-0 z-20 border-t border-slate-200 bg-white shadow-xl'
    >
      <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <button
            type='button'
            onClick={onCancel}
            className='text-sm font-medium text-slate-500 transition hover:text-slate-700'
          >
            İptal Et
          </button>
          <div className='flex space-x-3'>
            <button
              type={isFinalStep ? 'submit' : 'button'}
              onClick={isFinalStep ? onPublish : () => {}} // Son adımda form submit edilir
              disabled={!isFinalStep || isLoading}
              className={getButtonClass(!isFinalStep ? false : !isLoading)}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 inline h-4 w-4 animate-spin' /> Yayımlanıyor...
                </>
              ) : (
                <>
                  <Upload className='mr-2 inline h-4 w-4' /> Yayımla
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Ana Bileşen ---
const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams?.get('productId') || '';
  const isEditMode = !!productId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    isFree: false,
    license: 'Royalty free, no AI',
    tags: [],
    features: [],
    geometry: 'HardSurface',
    polygons: 0,
    vertices: 0,
    gameReady: false,
    aiGenerated: false,
  });

  const [coverImage, setCoverImage] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [existingProductFiles, setExistingProductFiles] = useState([]);
  const [productFiles, setProductFiles] = useState([]);
  const [model3dFile, setModel3dFile] = useState(null);
  const [model3dUrl, setModel3dUrl] = useState('');
  const [existingModel3dFile, setExistingModel3dFile] = useState(null);
  const [isModel3dUploading, setIsModel3dUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState([]);
  const [categories, setCategories] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const slug = useMemo(
    () =>
      (formData.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim(),
    [formData.title]
  );

  const formatBytes = (bytes = 0) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const v = bytes / Math.pow(k, i);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${sizes[i]}`;
  };

  const totalMediaSize = useMemo(
    () => mediaFiles.reduce((acc, f) => acc + (f?.size || 0), 0),
    [mediaFiles]
  );
  const totalProductSize = useMemo(
    () => productFiles.reduce((acc, f) => acc + (f?.size || 0), 0),
    [productFiles]
  );
  const totalExistingSize = useMemo(
    () => (existingProductFiles || []).reduce((acc, f) => acc + (f?.size || 0), 0),
    [existingProductFiles]
  );
  const totalFilesCombinedSize = useMemo(
    () => totalProductSize + totalExistingSize,
    [totalProductSize, totalExistingSize]
  );

  const getFileExt = (name = '') => {
    const idx = name.lastIndexOf('.');
    return idx !== -1 ? name.slice(idx + 1).toLowerCase() : '';
  };

  const shortenUrl = (u = '') => {
    try {
      const url = new URL(u, window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length <= 2) return url.origin + '/' + parts.join('/');
      return `${url.origin}/${parts[0]}/…/${parts[parts.length - 1]}`;
    } catch {
      return u;
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {}
  };

  const validateStep = (s) => {
    const issues = [];
    if (s === 1) {
      if (!formData.title?.trim()) issues.push('Başlık zorunludur.');
      if (!formData.description?.trim()) issues.push('Açıklama zorunludur.');
    }
    if (s === 2) {
      if (!coverUrl) issues.push('Kapak görseli zorunludur.');
      if (galleryUrls.length < 1) issues.push('En az bir galeri görseli ekleyin.');
    }
    if (s === 3) {
      if (existingProductFiles.length + productFiles.length < 1)
        issues.push('En az bir ürün dosyası ekleyin.');
    }
    if (s === 4) {
      if (!formData.category) issues.push('Kategori seçimi zorunludur.');
    }
    if (s === 5) {
      if (!formData.isFree && (!formData.price || Number(formData.price) <= 0)) {
        issues.push('Ücretli ürün için fiyat zorunludur.');
      }
    }
    setErrors(issues);
    return { valid: issues.length === 0, issues };
  };

  const uploadToApi = async (file, isPublic = false) => {
    const body = new FormData();
    body.set('file', file);
    const res = await fetch(`/api/upload?public=${isPublic ? 'true' : 'false'}`, {
      method: 'POST',
      body,
    });
    const data = await res.json();
    if (!res.ok || !data?.url) throw new Error(data?.error || 'Yükleme başarısız');
    return data;
  };

  const handleCoverSelect = async (files) => {
    const f = files?.[0];
    if (!f) return;
    setIsCoverUploading(true);
    try {
      const res = await uploadToApi(f, true);
      if (res?.url) setCoverUrl(res.url);
    } catch (_) {
      setErrors(['Kapak yüklenemedi. Lütfen tekrar deneyin.']);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleGallerySelect = async (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    setIsGalleryUploading(true);
    try {
      const results = await Promise.all(arr.map((f) => uploadToApi(f, true).catch(() => null)));
      const urls = results
        .filter(Boolean)
        .map((r) => r.url)
        .filter(Boolean);
      if (urls.length) setGalleryUrls((p) => [...p, ...urls]);
    } catch (_) {
      setErrors(['Bazı galeri görselleri yüklenemedi.']);
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const handleModel3dSelect = async (files) => {
    const f = files?.[0];
    if (!f) return;
    setIsModel3dUploading(true);
    try {
      const res = await uploadToApi(f, false);
      if (res?.url) {
        setModel3dUrl(res.url);
        setModel3dFile({
          url: res.url,
          fileName: res.fileName || f.name,
          size: res.size || f.size,
          type: res.type || f.type || 'model/fbx',
        });
      }
    } catch (_) {
      setErrors(['3D model yüklenemedi. Lütfen tekrar deneyin.']);
    } finally {
      setIsModel3dUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { valid } = validateStep(6);
    if (!valid) return;
    if (!formData.title || !formData.description || !formData.category) return;
    if (!coverUrl || galleryUrls.length === 0 || productFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const uploadedProductFiles = [];
      for (const f of productFiles) {
        const r = await uploadToApi(f, false);
        uploadedProductFiles.push(r);
      }

      const payload = {
        title: formData.title,
        ...(isEditMode ? {} : { slug }),
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        price: Number(formData.price ?? 0) || 0,
        isFree: !!formData.isFree,
        license: formData.license,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        features: formData.features,
        geometry: formData.geometry,
        polygons: Number(formData.polygons) || 0,
        vertices: Number(formData.vertices) || 0,
        gameReady: !!formData.gameReady,
        aiGenerated: !!formData.aiGenerated,
        coverImage: coverUrl,
        mediaImages: (galleryUrls || []).map((url) => ({ url })),
        productFiles: (isEditMode
          ? [...(existingProductFiles || []), ...uploadedProductFiles]
          : uploadedProductFiles
        ).map((p) => ({
          url: p.url,
          fileName: p.fileName || '',
          size: p.size || 0,
          type: p.type || '',
        })),
        model3dFile:
          model3dFile ||
          (isEditMode && existingModel3dFile
            ? typeof existingModel3dFile === 'object'
              ? existingModel3dFile
              : null
            : null),
      };

      const isEdit = !!productId;
      const endpoint = isEdit ? `/api/products/${productId}` : '/api/products';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || 'Kayıt hatası');
      router.push('/magaza-paneli?tab=products');
    } catch (err) {
      console.error(err);
      setErrors(['Ürün yüklenirken bir hata oluştu. Lütfen tekrar deneyin.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.ok && data.categories) {
          // Hierarchical yapıyı flat structure'a çevir (SelectGroup için)
          const subcategoriesMap = {};
          
          data.categories.forEach((parentCategory) => {
            if (parentCategory.children && parentCategory.children.length > 0) {
              subcategoriesMap[parentCategory.name] = parentCategory.children.map((child) => child.name);
            } else {
              subcategoriesMap[parentCategory.name] = [];
            }
          });
          
          setCategories(subcategoriesMap);
        }
      } catch (error) {
        console.error('Categories load error:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadProduct = async () => {
      if (!productId) return;
      try {
        const res = await fetch(`/api/products/${productId}`);
        const p = await res.json();
        if (!res.ok || !p?.id) return;
        if (ignore) return;
        const parsedTags =
          typeof p.tags === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.tags);
                } catch {
                  return [];
                }
              })()
            : Array.isArray(p.tags)
              ? p.tags
              : [];
        const parsedMedia =
          typeof p.mediaImages === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.mediaImages);
                } catch {
                  return [];
                }
              })()
            : Array.isArray(p.mediaImages)
              ? p.mediaImages
              : [];
        const parsedFiles =
          typeof p.productFiles === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.productFiles);
                } catch {
                  return [];
                }
              })()
            : Array.isArray(p.productFiles)
              ? p.productFiles
              : [];
        const parsedModel3d =
          typeof p.model3dFile === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.model3dFile);
                } catch {
                  return null;
                }
              })()
            : p.model3dFile
              ? p.model3dFile
              : null;
        setFormData((prev) => ({
          ...prev,
          title: p.title || '',
          description: p.description || '',
          category: p.category || '',
          subcategory: p.subcategory || '',
          price: p.price ?? '',
          isFree: !!p.isFree,
          license: p.license || prev.license,
          tags: parsedTags,
        }));
        setCoverUrl(p.coverImage || '');
        setGalleryUrls(parsedMedia.map((m) => m.url).filter(Boolean));
        setExistingProductFiles(parsedFiles);
        if (parsedModel3d) {
          setExistingModel3dFile(parsedModel3d);
          if (parsedModel3d.url) {
            setModel3dUrl(parsedModel3d.url);
          }
        }
      } catch (_) {
        // ignore
      }
    };
    loadProduct();
    return () => {
      ignore = true;
    };
  }, [productId]);

  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-white text-slate-500'>
          Yükleniyor...
        </div>
      }
    >
      <div className='min-h-screen bg-white'>
      {/* Kurumsal Başlık Bölümü */}
      <div className='sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Link
                href='/magaza-paneli'
                className='rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
                aria-label='Geri'
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className='text-xs font-medium tracking-wider text-gray-600 uppercase'>
                  Mağaza Paneli
                </div>
                <h1 className='mt-0.5 flex items-center gap-2 text-2xl font-extrabold text-slate-900'>
                  Yeni Ürün Yayımla <Rocket size={20} />
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <Wizard
            steps={[
              'Temel Bilgiler',
              'Medya Yükleme',
              'Teslimat Dosyaları',
              'Sınıflandırma ve Etiketleme',
              'Fiyatlandırma ve Lisanslama',
              'Özet ve Onay',
            ]}
            current={step}
            onPrev={() => {
              setStep((s) => Math.max(1, s - 1));
              setErrors([]);
            }}
            onNext={() => {
              const { valid } = validateStep(step);
              if (valid) setStep((s) => Math.min(6, s + 1));
            }}
            variant='compactBlue'
          >
            {/* Animasyonlu Hata Mesajları */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  variants={errorVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  className='flex items-start space-x-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800'
                >
                  <XCircle className='mt-0.5 shrink-0' size={18} />
                  <ul className='list-disc space-y-1 pl-5'>
                    {errors.map((e, i) => (
                      <li key={`${e}-${i}`} className='font-medium'>
                        {e}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Adım İçerikleri - Framer Motion ile Animasyonlu Geçiş */}
            <AnimatePresence mode='wait'>
              <motion.div
                key={step}
                initial='enter'
                animate='center'
                exit='exit'
                variants={contentVariants}
                className='w-full'
              >
                {step === 1 && (
                  <div className='space-y-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                    <h2 className='text-xl font-bold text-slate-800'>Temel Bilgiler</h2>
                    <div className='space-y-2'>
                      <label htmlFor='title' className='text-sm font-medium text-slate-700'>
                        Ürün Başlığı <span className='text-red-500'>*</span>
                      </label>
                      <input
                        id='title'
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        className='w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none'
                        placeholder='Örn. Realistik SUV 3D Model'
                        required
                      />
                    </div>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-slate-700'>
                          Kısa Bağlantı (Slug)
                        </label>
                        <input
                          value={slug}
                          readOnly
                          className='w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-500'
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <label htmlFor='description' className='text-sm font-medium text-slate-700'>
                        Detaylı Açıklama <span className='text-red-500'>*</span>
                      </label>
                      <textarea
                        id='description'
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, description: e.target.value }))
                        }
                        rows={6}
                        className='w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 focus:outline-none'
                        placeholder='Ürünün teknik detaylarını, kullanım alanlarını ve özelliklerini belirtin...'
                        required
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className='space-y-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                    <h2 className='text-xl font-bold text-slate-800'>Medya Yükleme</h2>
                    <div className='space-y-3'>
                      <div className='text-sm font-medium text-slate-700'>
                        Kapak Görseli (Zorunlu)
                      </div>
                      <Dropzone
                        accept='image/*'
                        multiple={false}
                        onFiles={handleCoverSelect}
                        variant='primary'
                      />
                      <div className='mt-3'>
                        {isCoverUploading && (
                          <span className='text-xs text-slate-500'>Kapak yükleniyor…</span>
                        )}
                        {!isCoverUploading && coverUrl && (
                          <div className='overflow-hidden rounded-xl ring-1 ring-slate-200'>
                            <img
                              src={coverUrl}
                              alt='Kapak'
                              className='aspect-video w-full object-cover'
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='h-px w-full bg-slate-200' />
                    <div className='space-y-3'>
                      <div className='text-sm font-medium text-slate-700'>
                        Galeri Görselleri (Min. 1)
                      </div>
                      <Dropzone
                        accept='image/*'
                        multiple
                        onFiles={handleGallerySelect}
                        variant='primary'
                      />
                      {isGalleryUploading && (
                        <div className='pt-1 text-xs text-slate-500'>Galeri yükleniyor…</div>
                      )}
                      {galleryUrls.length > 0 && (
                        <>
                          <div className='flex items-center justify-between pt-1 text-xs text-slate-600'>
                            <span className='font-semibold'>{galleryUrls.length} Görsel Hazır</span>
                          </div>
                          <div className='mt-3 grid grid-cols-2 gap-3 md:grid-cols-3'>
                            {galleryUrls.map((u, i) => (
                              <div
                                key={`${u}-${i}`}
                                className='group relative overflow-hidden rounded-xl ring-1 ring-slate-200'
                              >
                                <img
                                  src={u}
                                  alt={`Galeri ${i + 1}`}
                                  className='aspect-video w-full object-cover'
                                />
                                <button
                                  type='button'
                                  onClick={() =>
                                    setGalleryUrls((p) => p.filter((_, idx) => idx !== i))
                                  }
                                  className='absolute top-2 right-2 hidden rounded-md bg-white/90 px-2 py-1 text-xs text-slate-700 shadow group-hover:block'
                                >
                                  Kaldır
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className='space-y-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                    <h2 className='text-xl font-bold text-slate-800'>Teslimat Dosyaları</h2>
                    <div className='text-sm text-slate-600'>
                      Ürünün indirme linki olarak kullanılacak dosyaları (zip, rar, blend, fbx, vb.)
                      yükleyin.
                    </div>
                    <Dropzone
                      accept='*/*'
                      multiple
                      heightClass='h-52'
                      onFiles={(files) => setProductFiles((p) => [...p, ...files])}
                      variant='primary'
                    />
                    <div className='h-px w-full bg-slate-200' />
                    <div className='space-y-3'>
                      <div className='text-sm font-medium text-slate-700'>
                        3D Model Dosyası <span className='text-slate-400'>(Opsiyonel)</span>
                      </div>
                      <div className='text-xs text-slate-500'>
                        Ürün detay sayfasında 3D önizleme için kullanılacak dosyayı yükleyin. Desteklenen
                        formatlar: FBX, GLB, GLTF, OBJ, HDR, STL, PLY, 3DS
                      </div>
                      <Dropzone
                        accept='.fbx,.glb,.gltf,.obj,.hdr,.stl,.ply,.3ds,model/fbx,model/gltf-binary,model/gltf+json,model/obj,model/stl,model/ply,model/3ds,image/vnd.radiance,image/hdr'
                        multiple={false}
                        heightClass='h-40'
                        onFiles={handleModel3dSelect}
                        variant='primary'
                      />
                      {isModel3dUploading && (
                        <div className='pt-1 text-xs text-slate-500'>3D model yükleniyor…</div>
                      )}
                      {(model3dUrl || existingModel3dFile) && (
                        <div className='mt-3 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Package size={16} className='text-emerald-600' />
                              <span className='text-sm font-medium text-emerald-900'>
                                {model3dFile?.fileName ||
                                  (typeof existingModel3dFile === 'object'
                                    ? existingModel3dFile?.fileName
                                    : '3D Model')}{' '}
                                yüklendi
                              </span>
                            </div>
                            <button
                              type='button'
                              onClick={() => {
                                setModel3dUrl('');
                                setModel3dFile(null);
                                setExistingModel3dFile(null);
                              }}
                              className='text-xs text-emerald-700 hover:text-emerald-900'
                            >
                              Kaldır
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {(existingProductFiles.length > 0 || productFiles.length > 0) && (
                      <div className='space-y-2 pt-2'>
                        {existingProductFiles.map((f, i) => (
                          <div
                            key={`existing-${i}`}
                            className='flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200'
                          >
                            <div className='flex min-w-0 items-center gap-3 text-slate-700'>
                              <Package size={18} className='shrink-0 text-gray-500' />
                              <span className='truncate font-medium'>
                                {f.fileName || f.name || 'dosya'}
                              </span>
                              <span className='shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700'>
                                {formatBytes(f?.size)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {productFiles.map((f, i) => (
                          <div
                            key={`${f.name}-${i}`}
                            className='flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 transition hover:shadow-md'
                          >
                            <div className='flex min-w-0 items-center gap-3 text-slate-700'>
                              <Package size={18} className='shrink-0 text-gray-500' />
                              <span className='truncate font-medium'>{f.name}</span>
                              <span className='shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700'>
                                {formatBytes(f?.size)}
                              </span>
                            </div>
                            <button
                              type='button'
                              onClick={() =>
                                setProductFiles((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className='text-slate-500 transition hover:text-red-600'
                            >
                              Kaldır
                            </button>
                          </div>
                        ))}
                        <div className='mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200'>
                          <span>
                            Toplam: {existingProductFiles.length + productFiles.length} Dosya
                          </span>
                          <span>{formatBytes(totalFilesCombinedSize)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className='space-y-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                    <h2 className='text-xl font-bold text-slate-800'>
                      Sınıflandırma ve Etiketleme
                    </h2>
                    <p className='text-sm text-slate-600'>
                      Ürününüzü doğru kategoriyle eşleştirin ve bulunabilirliği artırmak için ilgili
                      etiketleri ekleyin.
                    </p>
                    {isLoadingCategories ? (
                      <div className='flex items-center justify-center py-8'>
                        <div className='text-center'>
                          <Loader2 className='mx-auto mb-2 h-6 w-6 animate-spin text-slate-500' />
                          <p className='text-sm text-slate-600'>Kategoriler yükleniyor...</p>
                        </div>
                      </div>
                    ) : (
                      <SelectGroup
                        categories={categories}
                        category={formData.category}
                        subcategory={formData.subcategory}
                        onCategory={(v) =>
                          setFormData((p) => ({ ...p, category: v, subcategory: '' }))
                        }
                        onSubcategory={(v) => setFormData((p) => ({ ...p, subcategory: v }))}
                        variant='primary'
                      />
                    )}
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-700'>
                        Etiketler (Max 10)
                      </label>
                      <TagInput
                        values={formData.tags}
                        onChange={(vals) => setFormData((p) => ({ ...p, tags: vals }))}
                        max={10}
                        variant='primary'
                      />
                      <p className='pt-1 text-xs text-slate-500'>
                        Ürününüzün aramalarda bulunmasını kolaylaştırmak için anahtar kelimeler
                        ekleyin.
                      </p>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className='rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                    <h2 className='mb-2 text-xl font-bold text-slate-800'>
                      Fiyatlandırma ve Lisanslama
                    </h2>
                    <p className='mb-4 text-sm text-slate-600'>
                      Ücretsiz ürünler için fiyat alanı devre dışı kalır. Lisans türü, alıcının
                      kullanabileceği hakları belirler.
                    </p>
                    <PriceSection
                      isFree={formData.isFree}
                      price={formData.price}
                      license={formData.license}
                      onToggleFree={(v) => setFormData((p) => ({ ...p, isFree: v }))}
                      onPrice={(v) => setFormData((p) => ({ ...p, price: v }))}
                      onLicense={(v) => setFormData((p) => ({ ...p, license: v }))}
                      variant='primary'
                    />
                  </div>
                )}

                {step === 6 && (
                  <div className='space-y-6'>
                    <div className='rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                      <h2 className='mb-6 text-xl font-bold text-slate-800'>Ürün Önizleme Kartı</h2>
                      <PreviewCard
                        coverUrl={coverUrl}
                        title={formData.title || 'Başlıksız Ürün'}
                        price={formData.isFree ? 0 : formData.price || 0}
                        tags={formData.tags}
                      />
                      <p className='mt-6 text-sm text-slate-600'>
                        Bu kart, ürününüzün mağaza listelerinde nasıl görüneceğini gösterir.
                      </p>
                    </div>

                    <div className='rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100'>
                      <h2 className='mb-4 text-xl font-bold text-slate-800'>Özet ve Onay</h2>
                      <div className='mb-4 grid gap-3 md:grid-cols-2'>
                        <div className='flex items-center gap-3'>
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt='Kapak'
                              className='h-12 w-20 rounded-md object-cover ring-1 ring-slate-200'
                            />
                          ) : (
                            <div className='h-12 w-20 rounded-md bg-slate-100 ring-1 ring-slate-200' />
                          )}
                          <div className='min-w-0'>
                            <div className='truncate text-xs text-slate-600'>
                              {shortenUrl(coverUrl) || '—'}
                            </div>
                            {coverUrl && (
                              <button
                                type='button'
                                onClick={() => copyToClipboard(coverUrl)}
                                className='text-xs text-blue-600 hover:underline'
                              >
                                Kopyala
                              </button>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='flex -space-x-2'>
                            {galleryUrls.slice(0, 3).map((u, i) => (
                              <img
                                key={`${u}-${i}`}
                                src={u}
                                alt={`g${i}`}
                                className='h-8 w-8 rounded-md object-cover ring-1 ring-slate-200'
                              />
                            ))}
                          </div>
                          <span className='text-sm text-slate-600'>
                            Galeri: {galleryUrls.length} görsel
                            {galleryUrls.length > 3 ? ` (+${galleryUrls.length - 3})` : ''}
                          </span>
                          <span
                            className={
                              formData.isFree
                                ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                                : 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200'
                            }
                          >
                            {formData.isFree ? 'Ücretsiz' : 'Ücretli'}
                          </span>
                        </div>
                      </div>
                      <div className='grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3'>
                        <div className='flex items-start gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <ImageIcon size={16} className='mt-0.5 text-slate-500' />
                          <div>
                            <div className='font-semibold text-slate-600'>Kapak</div>
                            <div className='truncate text-slate-800'>{coverUrl || '—'}</div>
                          </div>
                        </div>
                        <div className='flex items-start gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <TagIcon size={16} className='mt-0.5 text-slate-500' />
                          <div>
                            <div className='font-semibold text-slate-600'>Etiketler</div>
                            <div className='text-slate-800'>
                              {formData.tags.length ? formData.tags.join(', ') : 'Yok'}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-start gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <FileText size={16} className='mt-0.5 text-slate-500' />
                          <div>
                            <div className='font-semibold text-slate-600'>Dosyalar</div>
                            <div className='text-slate-800'>
                              {existingProductFiles.length + productFiles.length} adet •{' '}
                              {formatBytes(totalFilesCombinedSize)}
                            </div>
                          </div>
                        </div>
                        {productFiles.slice(0, 5).map((f, i) => (
                          <div
                            key={`sum-file-${i}`}
                            className='flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200'
                          >
                            <div className='min-w-0'>
                              <div className='truncate text-slate-800'>{f.name}</div>
                              <div className='text-xs text-slate-500'>{formatBytes(f.size)}</div>
                            </div>
                            <span className='ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200'>
                              {getFileExt(f.name) || 'dosya'}
                            </span>
                          </div>
                        ))}
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Başlık</div>
                          <div className='truncate text-slate-800'>{formData.title || '—'}</div>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Kategori</div>
                          <div className='truncate text-slate-800'>{formData.category || '—'}</div>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Alt Kategori</div>
                          <div className='truncate text-slate-800'>
                            {formData.subcategory || 'Yok'}
                          </div>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Fiyat</div>
                          <div className='truncate text-slate-800'>
                            {formData.isFree ? 'Ücretsiz' : `₺${formData.price || 0}`}
                          </div>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Lisans</div>
                          <div className='truncate text-slate-800'>{formData.license || '—'}</div>
                        </div>
                        <div className='rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100'>
                          <div className='mb-0.5 font-semibold text-slate-600'>Slug</div>
                          <div className='truncate text-slate-800'>{slug || '—'}</div>
                        </div>
                      </div>
                      <blockquote className='mt-6 border-l-4 border-gray-400 py-1 pl-4 text-sm text-slate-600 italic'>
                        "Yayımla" butonuna tıkladığınızda ürününüz sistemimize kaydedilecek ve
                        incelemeye alınacaktır.
                      </blockquote>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Wizard>
        </form>
      </div>

      {/* CustomActionBar ile sabit çubuğu kullanıyoruz */}
      <CustomActionBar
        onCancel={() => router.push('/magaza-paneli')}
        onPublish={handleSubmit}
        isLoading={isSubmitting}
        currentStep={step}
        totalSteps={6}
      />
      </div>
    </Suspense>
  );
};

export default Page;
