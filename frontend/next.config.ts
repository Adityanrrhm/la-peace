import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  // Proxy semua request /api/v1/* ke backend Go
  // Browser melihat semuanya sebagai same-origin (localhost:3000)
  // → tidak ada CORS, cookie bekerja normal
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        // BACKEND_URL: server-side only, tidak diekspos ke browser
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;