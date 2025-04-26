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
  
  // Add the rewrites to handle any URL path mismatches
  async rewrites() {
    return [
      // Redirect legacy /app/... paths to the correct routes in route groups
      {
        source: '/app/manager/dashboard',
        destination: '/manager',
      },
      {
        source: '/app/manager/:path*',
        destination: '/manager/:path*', 
      },
      {
        source: '/app/chef/:path*',
        destination: '/chef/:path*',
      },
      {
        source: '/app/:path*',
        destination: '/:path*',
      }
    ];
  },
};

export default nextConfig;