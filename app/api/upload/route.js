import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadImageToBunnyCDN } from '@/lib/upload.js';
// Removed unused external upload/auth imports to avoid conflicts

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

const ensureDir = async (dir) => {
  await mkdir(dir, { recursive: true });
};

const toSlug = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

export async function POST(request) {
  try {
    const form = await request.formData();
    // Hem 'file' hem de 'image' parametrelerini destekle
    const file = form.get('file') || form.get('image');
    const useLocal = form.get('useLocal') === 'true'; // Artık local için özel parametre
    const useBunnyCDN = form.get('useBunnyCDN') !== 'false'; // Default true

    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: 'Dosya bulunamadı' }, { status: 200 });
    }

    // Validate size
    const size = file.size ?? 0;
    if (size <= 0) {
      return NextResponse.json({ ok: false, error: 'Geçersiz dosya' }, { status: 200 });
    }
    if (size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Dosya boyutu 50MB limitini aşıyor' },
        { status: 200 }
      );
    }

    const originalName = file.name || 'upload';
    const ext = originalName.includes('.') ? `.${originalName.split('.').pop()}` : '';
    const base = toSlug(originalName.replace(ext, '')) || 'dosya';

    // 3D model dosya uzantılarını kontrol et
    const modelExtensions = ['.fbx', '.glb', '.gltf', '.obj', '.hdr', '.stl', '.ply', '.3ds'];
    const isModelFile = modelExtensions.some((modelExt) => ext.toLowerCase() === modelExt);
    
    // Görsel dosya uzantılarını kontrol et
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const isImageFile = imageExtensions.some((imgExt) => ext.toLowerCase() === imgExt);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const ts = now.getTime();

    // Dosya tipine göre klasör seç
    const folder = isModelFile ? 'models' : isImageFile ? 'images' : 'files';

    // Default olarak CDN kullan (useLocal true değilse)
    if (!useLocal && useBunnyCDN) {
      try {
        const fileName = `${folder}/${yyyy}-${mm}/${base}-${ts}${ext}`;
        const result = await uploadImageToBunnyCDN(file, fileName);
        
        return NextResponse.json(
          {
            ok: true,
            url: result.url,
            fileName: originalName,
            size,
            type: file.type || 'application/octet-stream',
            cdn: 'bunny',
          },
          { status: 200 }
        );
      } catch (bunnyError) {
        console.error('BunnyCDN upload error:', bunnyError);
        console.error('Error details:', {
          message: bunnyError.message,
          stack: bunnyError.stack,
          fileName: originalName,
          fileSize: size,
          fileType: file.type,
        });
        // Hata durumunda normal upload'a düş
      }
    }

    // Normal upload (local) - sadece useLocal true ise veya CDN hatası varsa
    const relDir = path.posix.join('uploads', `${yyyy}-${mm}`);
    const outDir = path.join(process.cwd(), 'public', relDir);
    await ensureDir(outDir);

    const filename = `${base}-${ts}${ext}`;
    const diskPath = path.join(outDir, filename);
    const url = `/${relDir}/${filename}`.replace(/\\/g, '/');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(diskPath, buffer);

    return NextResponse.json(
      {
        ok: true,
        url,
        fileName: originalName,
        size,
        type: file.type || 'application/octet-stream',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('UPLOAD_ERROR', err);
    return NextResponse.json({ ok: false, error: 'Yükleme hatası' }, { status: 200 });
  }
}

// Single POST handler retained above
