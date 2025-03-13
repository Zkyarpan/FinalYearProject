// next.config.js - Safe version with minimal changes
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Original settings from your working config
  poweredByHeader: false,
  reactStrictMode: false,

  // Keep your existing image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'dqy38fnwh4fqs.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
    ],
    minimumCacheTTL: 60, // Keep your original value or set to 60 if unsure
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Your original headers configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },

  // Your original webpack configuration - with minimal optimizations
  webpack: (config, { dev, isServer }) => {
    // Only apply these optimizations in production
    if (!dev) {
      // Enable production mode optimizations
      config.mode = 'production';
    }
    return config;
  },

  // Basic performance optimizations that shouldn't break anything
  compress: true,
  generateEtags: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  trailingSlash: false,
};

module.exports = nextConfig;
