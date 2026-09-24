import { supabase } from '../lib/supabase';
import type { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });

/** Yükleme hatasını kullanıcının diline çevirir; bilinmeyen hatalarda genel mesaj döner. */
export function describeUploadError(err: unknown, lang: Language = 'tr'): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  switch ((err as { code?: string })?.code) {
    case 'upload/process': return t.errImageProcess;
    case 'upload/denied': return t.errUploadDenied;
    case 'upload/bad-url': return t.errBadDownloadUrl;
    case 'upload/no-file': return t.errNoFile;
    case 'upload/need-login': return t.errNeedLoginUpload;
    case 'upload/not-image': return t.errNotImage;
    case 'upload/bad-profile-url': return t.errBadProfileUrl;
    default: return t.errUploadFailed;
  }
}

export interface UploadProgressCallback {
  (percentage: number): void;
}

/**
 * Client-side image compression and resizing using HTML5 Canvas.
 * Converts large multi-megabyte photos (3-10 MB) into an optimized, lightweight WebP/JPEG blob (< 100 KB)
 * maintaining aspect ratio and retina quality for profile avatars.
 */
export async function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.85
): Promise<{ blob: Blob; contentType: string }> {
  return new Promise((resolve, reject) => {
    // If browser doesn't support canvas or image is an svg/gif, return as is
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve({ blob: file, contentType: file.type });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: return original file if canvas context unavailable
        resolve({ blob: file, contentType: file.type });
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format (prefer WebP, fallback to JPEG)
      const targetFormat = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, contentType: targetFormat });
          } else {
            // Fallback to jpeg if webp export fails
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve({ blob: jpegBlob, contentType: 'image/jpeg' });
                } else {
                  resolve({ blob: file, contentType: file.type });
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        targetFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(coded('upload/process', 'Image processing failed.'));
    };

    img.src = objectUrl;
  });
}

async function uploadToBucket(
  bucket: string,
  filePath: string,
  blob: Blob,
  contentType: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // supabase-js storage upload has no native progress callback; report start/end.
  onProgress?.(0);
  const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw coded(
      /row-level security|not authorized|unauthorized/i.test(error.message) ? 'upload/denied' : 'upload/failed',
      `Upload failed: ${error.message}`
    );
  }
  onProgress?.(100);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!data.publicUrl.startsWith('http')) {
    throw coded('upload/bad-url', 'Invalid download URL.');
  }
  return data.publicUrl;
}

/**
 * Uploads a profile image to Cloudinary (if configured) or Supabase Storage.
 * Always returns a secure HTTPS download URL.
 * NEVER returns raw Base64 strings.
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw coded('upload/no-file', 'No file to upload.');
  }

  // 1. Check file type
  if (!file.type.startsWith('image/')) {
    throw coded('upload/not-image', 'Only image files can be uploaded.');
  }

  // 2. Client-side compression
  const { blob, contentType } = await compressImage(file, 600, 600, 0.85);

  // 3. Optional Cloudinary Support (if environment variables are provided)
  const cloudinaryCloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudinaryCloudName && cloudinaryPreset) {
    try {
      const formData = new FormData();
      formData.append('file', blob, `avatar_${userId}.webp`);
      formData.append('upload_preset', cloudinaryPreset);
      formData.append('folder', 'padova_avatars');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw coded('upload/failed', `Cloudinary upload error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to Supabase Storage:', cloudErr);
    }
  }

  // 4. Supabase Storage Upload (Standard Production Pipeline)
  const cleanUserId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest_user';
  const timestamp = Date.now();
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `${cleanUserId}/${timestamp}_avatar.${extension}`;

  return uploadToBucket('profile_photos', filePath, blob, contentType, onProgress);
}

/**
 * Uploads a listing photo to Supabase Storage with canvas compression.
 * Yükleme başarısız olursa hata fırlatır; base64'e düşmez.
 */
export async function uploadListingPhoto(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw coded('upload/no-file', 'No file to upload.');
  }
  if (!userId) {
    throw coded('upload/need-login', 'Sign in to upload.');
  }
  if (!file.type.startsWith('image/')) {
    throw coded('upload/not-image', 'Only image files can be uploaded.');
  }

  // Compress to max 1280x850 at 0.78 quality to keep size small (<90KB)
  const { blob, contentType } = await compressImage(file, 1280, 850, 0.78);

  const rand = Math.random().toString(36).substring(2, 7);
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  // Yol, Supabase Storage RLS politikasındaki listing_photos bucket'ının {userId}/{fileName} kuralıyla eşleşmeli.
  const filePath = `${userId}/${Date.now()}_${rand}.${extension}`;

  return uploadToBucket('listing_photos', filePath, blob, contentType, onProgress);
}
