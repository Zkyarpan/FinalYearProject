/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core settings
  poweredByHeader: false,
  reactStrictMode: false,

  // Enable server components as much as possible for better performance
  experimental: {
    // Changed to the new property name
    serverExternalPackages: ['mongoose', 'bcryptjs'],
    optimizeCss: true, // Optimize CSS
    scrollRestoration: true,
    optimisticClientCache: true,
  },

  // Image optimizations
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'dqy38fnwh4fqs.cloudfront.net' },
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
    ],
    minimumCacheTTL: 86400, // Increase cache time to 24 hours
    deviceSizes: [640, 750, 1080, 1920], // Reduced sizes
    imageSizes: [16, 64, 128], // Only necessary sizes
  },

  // CORS headers
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
      // Enhanced cache headers
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

  // Production optimizations
  compress: true,
  generateEtags: true,

  // Only include necessary page extensions
  pageExtensions: ['tsx', 'ts'],
  trailingSlash: false,

  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
