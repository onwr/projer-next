import { clsx } from 'clsx';

export const cn = (...inputs) => {
  return clsx(inputs);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(price);
};

export const generateSlug = (text) => {
  const trMap = {
    ç: 'c',
    Ç: 'C',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    İ: 'I',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
  };

  return text
    .split('')
    .map((char) => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '');
  const safeName = generateSlug(nameWithoutExt);

  return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomString}_${safeName}.${extension}`;
};

export const isValidImageFormat = (file) => {
  const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validFormats.includes(file.type);
};

export const isValid3DFormat = (file) => {
  const validExtensions = ['.fbx', '.obj', '.glb', '.gltf', '.blend', '.max', '.ma', '.mb'];
  return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
};

export const isValidArchiveFormat = (file) => {
  const validExtensions = ['.zip', '.rar', '.7z'];
  return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
};
