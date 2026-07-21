import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { put } from '@vercel/blob';

// Storage abstraction. With BLOB_READ_WRITE_TOKEN set (Vercel > Storage > Blob),
// images go to Vercel Blob — required in production, since Vercel's serverless
// functions have no persistent/writable disk across invocations or regions.
// Without it, falls back to the local filesystem under /public/uploads, which is
// fine for local dev but silently loses uploads on every redeploy/cold start —
// never use the fallback in production.

export interface SavedImage {
  url: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function saveImageBuffer(buffer: Buffer, mediaType: string): Promise<SavedImage> {
  const ext = (mediaType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const filename = `${uuid()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: 'public',
      contentType: mediaType,
    });
    return { url: blob.url };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}` };
}
