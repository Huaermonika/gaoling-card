/** 图片上传：统一压成 webp，原图长边 1600，缩略图 360。 */

export interface PreparedImage {
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图片解码失败'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function draw(source: ImageBitmap | HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const width = 'width' in source ? source.width : 0;
  const height = 'height' in source ? source.height : 0;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');
  ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))),
      'image/webp',
      quality,
    );
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const source = await loadImage(file);
  const full = draw(source, 1600);
  const thumb = draw(source, 360);
  const [blob, thumbBlob] = await Promise.all([toBlob(full, 0.88), toBlob(thumb, 0.8)]);
  if ('close' in source) source.close();
  return { blob, thumbBlob, width: full.width, height: full.height };
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(blob);
  });
}
