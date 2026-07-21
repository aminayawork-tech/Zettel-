import sharp from 'sharp';
import { saveImageBuffer } from '@/lib/storage';
import { analyzeImage } from '@/lib/ai';

export interface ProcessedImage {
  url: string;
  width: number;
  height: number;
  ocrText: string | null;
  aiDescription: string | null;
}

const MAX_DIMENSION = 1600; // keeps storage + vision token cost sane; client already compresses before upload

export async function processUploadedImage(file: File): Promise<ProcessedImage> {
  const original = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(original).rotate(); // auto-orient from EXIF
  const meta = await pipeline.metadata();
  if ((meta.width || 0) > MAX_DIMENSION || (meta.height || 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside' });
  }
  const jpeg = await pipeline.jpeg({ quality: 82 }).toBuffer();
  const finalMeta = await sharp(jpeg).metadata();

  const { url } = await saveImageBuffer(jpeg, 'image/jpeg');
  const analysis = await analyzeImage(jpeg.toString('base64'), 'image/jpeg');

  return {
    url,
    width: finalMeta.width || 0,
    height: finalMeta.height || 0,
    ocrText: analysis?.ocrText || null,
    aiDescription: analysis?.aiDescription || null,
  };
}
