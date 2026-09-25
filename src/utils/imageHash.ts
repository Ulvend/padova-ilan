// Görsel özeti (dHash, 64 bit): görüntü 9x8 gri tonlamaya indirilir, her satırda komşu piksellerin parlaklığı karşılaştırılır.
// Yeniden boyutlandırma, sıkıştırma ve küçük renk oynamalarına dayanıklıdır. Aynalanmış kopyaları da yakalamak için
// yatay çevrilmiş görüntünün özeti de üretilir. Karşılaştırma sunucuda yapılır (register_listing_photo).

const COLS = 9;
const ROWS = 8;
const BLOCK = 8; // ara örnekleme: 72x64 piksel, 8x8'lik bloklar ortalanır (doğrudan 9x8'e çizmek keskin ayrıntıyı atlar)

export interface ImageHashes {
  hash: string;
  flipped: string;
}

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be decoded.'));
    };
    img.src = url;
  });

const bitsOf = (gray: number[][]): string => {
  let bits = '';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS - 1; x++) bits += gray[y][x] > gray[y][x + 1] ? '1' : '0';
  }
  return bits;
};

/** Görüntünün 64 bitlik dHash'ini ve yatay çevrilmiş halinin dHash'ini "0101…" dizisi olarak döner. */
export async function computeImageHashes(file: Blob): Promise<ImageHashes> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unavailable.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const gray: number[][] = [];
  for (let by = 0; by < ROWS; by++) {
    const row: number[] = [];
    for (let bx = 0; bx < COLS; bx++) {
      let sum = 0;
      for (let y = 0; y < BLOCK; y++) {
        for (let x = 0; x < BLOCK; x++) {
          const i = ((by * BLOCK + y) * canvas.width + (bx * BLOCK + x)) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
      }
      row.push(sum / (BLOCK * BLOCK));
    }
    gray.push(row);
  }

  return { hash: bitsOf(gray), flipped: bitsOf(gray.map((row) => [...row].reverse())) };
}
