'use client';

import imageCompression from 'browser-image-compression';

// Client-side compression before upload — keeps payloads small and uploads fast,
// especially for phone-camera photos of book pages / whiteboards.
export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file; // fall back to original if compression fails for any reason
  }
}
