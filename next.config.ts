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
  
  // Removed rewrite rules to rely solely on App Router for path resolution.
  // async rewrites() {
  //   return [
  //     // ... rewrite rules removed ...
  //   ];
  // },
};

export default nextConfig;
