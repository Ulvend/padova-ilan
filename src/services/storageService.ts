import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

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
      reject(new Error('Görsel dosyası işlenirken hata oluştu.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads a profile image to Cloudinary (if configured) or Firebase Storage.
 * Always returns a secure HTTPS download URL.
 * NEVER returns raw Base64 strings.
 */
export async function uploadProfilePhoto(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('Yüklenecek görsel dosyası bulunamadı.');
  }

  // 1. Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnızca görsel dosyaları (PNG, JPG, WEBP) yüklenebilir.');
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
        throw new Error(`Cloudinary yükleme hatası: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to Firebase Storage:', cloudErr);
    }
  }

  // 4. Firebase Storage Upload (Standard Production Pipeline)
  const cleanUserId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest_user';
  const timestamp = Date.now();
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `profile_photos/${cleanUserId}/${timestamp}_avatar.${extension}`;

  const storageRef = ref(storage, filePath);
  const metadata = {
    contentType,
    customMetadata: {
      userId: cleanUserId,
      uploadedAt: new Date().toISOString(),
    },
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(
          new Error(
            error.code === 'storage/unauthorized'
              ? 'Fotoğraf yükleme izniniz bulunmuyor (Oturum açık olmayabilir).'
              : `Fotoğraf yüklenemedi: ${error.message}`
          )
        );
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (!downloadUrl.startsWith('https://') && !downloadUrl.startsWith('http://')) {
            throw new Error('Dönen indirme adresi geçerli bir web adresi değil.');
          }
          resolve(downloadUrl);
        } catch (urlErr: any) {
          console.error('Failed to get download URL:', urlErr);
          reject(new Error(`İndirme bağlantısı alınamadı: ${urlErr?.message || urlErr}`));
        }
      }
    );
  });
}

/**
 * Uploads a listing photo to Firebase Storage with canvas compression.
 * Yükleme başarısız olursa hata fırlatır; base64'e düşmez (Firestore belgesi 1 MB sınırını aşar).
 */
export async function uploadListingPhoto(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('Yüklenecek görsel dosyası bulunamadı.');
  }
  if (!userId) {
    throw new Error('Fotoğraf yüklemek için giriş yapmalısınız.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Yalnızca görsel dosyaları (PNG, JPG, WEBP) yüklenebilir.');
  }

  // Compress to max 1280x850 at 0.78 quality to keep size small (<90KB)
  const { blob, contentType } = await compressImage(file, 1280, 850, 0.78);

  const rand = Math.random().toString(36).substring(2, 7);
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  // Yol, storage.rules'daki listing_photos/{userId}/{fileName} kuralıyla eşleşmeli.
  const filePath = `listing_photos/${userId}/${Date.now()}_${rand}.${extension}`;

  const storageRef = ref(storage, filePath);
  const metadata = {
    contentType,
    customMetadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (error) => {
        console.error('Listing photo upload error:', error);
        reject(
          new Error(
            error.code === 'storage/unauthorized'
              ? 'Fotoğraf yükleme izniniz yok. Giriş yaptığınızdan emin olun.'
              : `Fotoğraf yüklenemedi: ${error.message}`
          )
        );
      },
      async () => {
        try {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        } catch (urlErr: any) {
          reject(new Error(`İndirme bağlantısı alınamadı: ${urlErr?.message || urlErr}`));
        }
      }
    );
  });
}
