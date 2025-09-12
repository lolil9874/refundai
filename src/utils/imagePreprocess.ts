"use client";

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function toGrayscaleAndThreshold(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1) Build grayscale + histogram for Otsu
  const hist = new Array<number>(256).fill(0);
  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luma
    const y = Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
    gray[j] = y;
    hist[y]++;
  }

  // 2) Otsu threshold
  const total = width * height;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 127;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);

    if (between > varMax) {
      varMax = between;
      threshold = t;
    }
  }

  // 3) Apply threshold -> binary image
  for (let j = 0, i = 0; j < gray.length; j++, i += 4) {
    const v = gray[j] > threshold ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    // keep alpha
  }

  ctx.putImageData(imageData, 0, 0);
}

export async function preprocessImageFileForOCR(file: File): Promise<string> {
  const img = await loadImageFromFile(file);

  // Target size: upscale small images, cap large ones
  const maxDim = 2000; // cap
  const minDim = 1200; // try to reach at least this
  const { width, height } = img;

  // Compute scale to target within [minDim, maxDim]
  const largestSide = Math.max(width, height);
  let scale = 1;
  if (largestSide < minDim) {
    scale = minDim / largestSide;
  } else if (largestSide > maxDim) {
    scale = maxDim / largestSide;
  }

  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // High-quality resize
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, outW, outH);

  // Convert to grayscale and binarize (Otsu)
  toGrayscaleAndThreshold(canvas);

  // Return as high-quality JPEG to help OCR stability
  return canvas.toDataURL("image/jpeg", 0.95);
}

// Optional: preprocess an existing canvas (e.g., a rendered PDF page)
export function preprocessCanvasForOCR(canvas: HTMLCanvasElement): string {
  const work = document.createElement("canvas");
  work.width = canvas.width;
  work.height = canvas.height;
  const ctx = work.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(canvas, 0, 0);
  toGrayscaleAndThreshold(work);
  return work.toDataURL("image/jpeg", 0.95);
}