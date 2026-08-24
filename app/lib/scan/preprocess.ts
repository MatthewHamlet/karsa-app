const TARGET_WIDTH = 2000;
const MAX_WIDTH = 3000;

function otsuThreshold(histogram: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];

  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t += 1) {
    weightB += histogram[t];
    if (weightB === 0) continue;

    const weightF = total - weightB;
    if (weightF === 0) break;

    sumB += t * histogram[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) ** 2;

    if (between > best) {
      best = between;
      threshold = t;
    }
  }

  return threshold;
}

export async function preprocess(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  const scale = Math.min(MAX_WIDTH / bitmap.width, Math.max(1, TARGET_WIDTH / bitmap.width));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return source;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const image = ctx.getImageData(0, 0, width, height);
  const pixels = image.data;
  const grey = new Uint8ClampedArray(width * height);
  const histogram = new Array<number>(256).fill(0);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const value = Math.round(
      0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2],
    );
    grey[p] = value;
    histogram[value] += 1;
  }

  const threshold = otsuThreshold(histogram, width * height);
  const soft = 28;

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const value = grey[p];
    let out: number;

    if (value <= threshold - soft) out = 0;
    else if (value >= threshold + soft) out = 255;
    else out = Math.round(((value - (threshold - soft)) / (soft * 2)) * 255);

    pixels[i] = out;
    pixels[i + 1] = out;
    pixels[i + 2] = out;
    pixels[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );

  return blob ?? source;
}
