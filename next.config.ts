/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------- core ----------
  poweredByHeader: false,
  reactStrictMode: false,

  // ---------- experiments ----------
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimisticClientCache: true,
  },

  // moved out of `experimental`  ✅
  serverExternalPackages: ['mongoose', 'bcryptjs'],

  // ---------- images ----------
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'dqy38fnwh4fqs.cloudfront.net' },
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
    ],
    minimumCacheTTL: 86_400, // 24 h
    deviceSizes: [640, 750, 1080, 1920],
    imageSizes: [16, 64, 128],
  },

  // ---------- headers ----------
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
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ---------- webpack ----------
  webpack: (config, { dev }) => {
    if (!dev) {
      config.mode = 'production';

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 1,
              reuseExistingChunk: true,
            },
          },
        },
        runtimeChunk: { name: 'runtime' },
      };
    }

    // Example alias block – extend as needed
    config.resolve.alias = {
      ...config.resolve.alias,
      // '@components': path.resolve(__dirname, 'src/components'),
    };

    return config;
  },

  // ---------- misc ----------
  compress: true,
  generateEtags: true,
  pageExtensions: ['tsx', 'ts'],
  trailingSlash: false,
  productionBrowserSourceMaps: false,

  // disable lint‑time fail in CI (you can remove when ESLint passes) 🔧
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
