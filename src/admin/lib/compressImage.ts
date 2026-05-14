// Compression d'image côté navigateur, sans dépendance externe.
// - Redimensionne à `maxDimension` px sur le plus grand côté (préserve le ratio).
// - Réencode en JPEG qualité `quality`.
// - Si le résultat est plus gros que l'original, on garde l'original.
// - Non-images / GIF / SVG → renvoie le fichier tel quel.

export type CompressOptions = {
  maxDimension?: number; // défaut 2000 px
  quality?: number; // 0..1, défaut 0.82
};

export type CompressResult = {
  file: File;
  originalSize: number;
  finalSize: number;
  resized: boolean;
};

const isCompressibleImage = (file: File): boolean => {
  if (!file.type.startsWith("image/")) return false;
  // On évite les formats qu'on ne veut pas réencoder en JPEG (anim, vector).
  if (file.type === "image/gif" || file.type === "image/svg+xml") return false;
  return true;
};

const loadBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fallback ci-dessous
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

export const compressImage = async (
  file: File,
  opts: CompressOptions = {},
): Promise<CompressResult> => {
  const maxDimension = opts.maxDimension ?? 2000;
  const quality = opts.quality ?? 0.82;
  const originalSize = file.size;

  if (!isCompressibleImage(file)) {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }

  const srcW = "width" in bitmap ? bitmap.width : bitmap.naturalWidth;
  const srcH = "height" in bitmap ? bitmap.height : bitmap.naturalHeight;
  if (!srcW || !srcH) {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }

  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Fond blanc — utile si l'image source a un canal alpha (PNG transparent → JPEG).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dstW, dstH);
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, dstW, dstH);
  if ("close" in bitmap) (bitmap as ImageBitmap).close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }

  // Si la compression a échoué à réduire (rare : photo déjà très optimisée), on garde l'original.
  if (blob.size >= originalSize) {
    return { file, originalSize, finalSize: originalSize, resized: false };
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const compressed = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return {
    file: compressed,
    originalSize,
    finalSize: compressed.size,
    resized: scale < 1,
  };
};

export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};
