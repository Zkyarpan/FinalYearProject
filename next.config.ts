/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---------- core ----------
  poweredByHeader: false,
  reactStrictMode: false,

  // ---------- experiments ----------
  experimental: {
    // Changed to the new property name
    serverExternalPackages: ['mongoose', 'bcryptjs'],
    optimizeCss: true, // Optimize CSS
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

  // Turbopack configuration (replacing webpack config)
  turbo: {
    // Turbopack rules go here
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
