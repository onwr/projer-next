// ImgBB Upload
export const uploadImageToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error('ImgBB upload failed');
  }

  return {
    success: true,
    url: data.data.url,
    deleteUrl: data.data.delete_url,
  };
};

// Multiple ImgBB Uploads
export const uploadMultipleImagesToImgBB = async (files) => {
  const uploadPromises = files.map((file) => uploadImageToImgBB(file));
  return await Promise.all(uploadPromises);
};

// Bunny CDN Upload
export const uploadFileToBunnyCDN = async (file, fileName) => {
  const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL;
  const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
  const BUNNY_PULL_ZONE = process.env.BUNNY_PULL_ZONE;

  if (!BUNNY_CDN_URL || !BUNNY_API_KEY || !BUNNY_PULL_ZONE) {
    throw new Error('Bunny CDN configuration missing');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const response = await fetch(`${BUNNY_CDN_URL}${fileName}`, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_API_KEY,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny CDN upload failed: ${response.status} - ${errorText}`);
  }

  const cdnUrl = `${BUNNY_PULL_ZONE}/${fileName}`;

  return {
    success: true,
    url: cdnUrl,
    fileName: fileName,
    size: file.size,
    type: file.type,
  };
};

// Bunny CDN Image Upload (görsel yükleme için)
export const uploadImageToBunnyCDN = async (file, fileName) => {
  // Görsel dosyaları için özel işlem gerekmez, aynı fonksiyonu kullan
  return await uploadFileToBunnyCDN(file, fileName);
};

// Multiple Bunny CDN Image Uploads
export const uploadMultipleImagesToBunnyCDN = async (files, basePath = 'images/') => {
  const uploadPromises = files.map(async (file, index) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = `${basePath}${timestamp}-${index}.${ext}`;
    return await uploadImageToBunnyCDN(file, fileName);
  });
  return await Promise.all(uploadPromises);
};
