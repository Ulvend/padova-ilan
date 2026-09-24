-- Storage: yalnızca raster görseller. SVG dosyaları <script> / inline JavaScript içerebildiği için (XSS)
-- ve GIF/SVG istemcide sıkıştırılamadığı için bucket'lardan kaldırıldı. Kod tarafındaki liste
-- src/services/storageService.ts ALLOWED_IMAGE_TYPES ile uyumlu tutulmalıdır.
--
-- 0002_storage.sql'deki `on conflict do nothing` bucket'ları zaten oluşturduğu için izinli tipler burada güncellenir.

update storage.buckets
  set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
  where id in ('profile_photos', 'listing_photos');
