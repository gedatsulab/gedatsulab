import { LoadedImage, MAX_SOURCE_DIMENSION } from '../types';

function computeDownsampledSize(width: number, height: number, maxDim: number) {
  const longest = Math.max(width, height);
  if (longest <= maxDim) {
    return { width, height };
  }
  const scale = maxDim / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadViaImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました。対応している画像形式か確認してください。'));
    };
    img.src = url;
  });
}

/**
 * Loads an image file and immediately downsamples it so its longer side is <= 1500px.
 * Keeping only the downsampled offscreen canvas in memory prevents iOS Safari canvas crashes.
 */
export async function loadAndDownsampleImage(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name)) {
    throw new Error('画像ファイルを選択してください。');
  }

  let source: ImageBitmap | HTMLImageElement;
  let originalWidth: number;
  let originalHeight: number;
  let isBitmap = false;

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      source = bitmap;
      originalWidth = bitmap.width;
      originalHeight = bitmap.height;
      isBitmap = true;
    } catch {
      const img = await loadViaImageElement(file);
      source = img;
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;
    }
  } else {
    const img = await loadViaImageElement(file);
    source = img;
    originalWidth = img.naturalWidth;
    originalHeight = img.naturalHeight;
  }

  const { width, height } = computeDownsampledSize(
    originalWidth,
    originalHeight,
    MAX_SOURCE_DIMENSION,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (isBitmap) (source as ImageBitmap).close();
    throw new Error('Canvasコンテキストの初期化に失敗しました。');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  if (isBitmap) {
    (source as ImageBitmap).close();
  }

  return {
    canvas,
    width,
    height,
    originalWidth,
    originalHeight,
    fileName: file.name,
  };
}
