'use client';

import imageCompression from 'browser-image-compression';

const COMPRESSION_TIMEOUT_MS = 8000;

// Client-side compression before upload — keeps payloads small and uploads fast,
// especially for phone-camera photos of book pages / whiteboards.
//
// browser-image-compression decodes via <canvas>, which some mobile browsers
// (notably iOS Safari with HEIC photos) can hang on indefinitely instead of
// rejecting — so a plain try/catch isn't enough. Race it against a timeout and
// fall back to the original, unmodified file either way.
export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await Promise.race([
      imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2000,
        useWebWorker: false,
        fileType: file.type,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('compression timed out')), COMPRESSION_TIMEOUT_MS)),
    ]);
    return compressed;
  } catch {
    return file; // fall back to the original, uncompressed file for any failure or timeout
  }
}
