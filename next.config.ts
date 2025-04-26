import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep your existing configurations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Removed the rewrites function as it might conflict with App Router's handling of route groups and static assets.
};

export default nextConfig;
