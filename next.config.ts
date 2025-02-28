const nextConfig = {
  // Your existing settings
  poweredByHeader: false,
  reactStrictMode: false,

  // Enable production optimizations
  output: 'standalone',
  productionBrowserSourceMaps: false,

  // Existing image configuration
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
    // Add image optimization settings
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Your existing headers configuration
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

  // Enhanced webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Only apply these optimizations in production
    if (!dev) {
      // Enable production mode optimizations
      config.mode = 'production';

      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        minimize: true,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name: (module, chunks) => {
                const crypto = require('crypto');
                return crypto
                  .createHash('sha1')
                  .update(chunks.map(c => c.name).join('_'))
                  .digest('hex')
                  .substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Add compression
  compress: true,

  // Enable proper caching
  generateEtags: true,

  // Optimize page loading
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Add proper trailing slashes handling
  trailingSlash: false,
};

module.exports = nextConfig;
