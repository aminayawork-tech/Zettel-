/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
    // sharp is used directly inside a Server Action (image-pipeline.ts), not just
    // through next/image — without this, Next's bundler can mishandle sharp's
    // native binary in the serverless output, so it works locally but silently
    // fails (or throws) once deployed.
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }],
  },
};

module.exports = nextConfig;
