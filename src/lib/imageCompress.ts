const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.85;
const BIG_FILE_BYTES = 1024 * 1024; // 1MB

export async function fileToStoredDataURL(file: File): Promise<string> {
  const rawDataURL = await readAsDataURL(file);

  if (file.size <= BIG_FILE_BYTES) return rawDataURL;

  try {
    const img = await loadImage(rawDataURL);
    if (img.width <= MAX_WIDTH) return rawDataURL;

    const scale = MAX_WIDTH / img.width;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataURL;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch (err) {
    console.warn('[imageCompress] falling back to raw data URL:', err);
    return rawDataURL;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}
