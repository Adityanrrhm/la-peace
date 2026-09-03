import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // For CSR-only deployment (no SSR process needed)
  output: 'export',
  
  // Image optimization not needed for static export
  images: {
    unoptimized: true,
  },
  
  // Rewrites for API proxy in development
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;