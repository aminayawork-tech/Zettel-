import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';

// Storage abstraction: today this writes to the local filesystem under
// /public/uploads so the app runs with zero external config. Swap the body
// of `saveImage` for an S3/Cloudinary SDK call (same signature) to go to
// production — nothing above this layer needs to change.

export interface SavedImage {
  url: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function saveImageBuffer(buffer: Buffer, mediaType: string): Promise<SavedImage> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = (mediaType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const filename = `${uuid()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}` };
}
