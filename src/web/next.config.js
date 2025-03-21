// Import the bundle analyzer for production build analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Next.js configuration for the Revolucare platform
 * This configuration handles performance optimization, security headers,
 * internationalization, and various build optimizations.
 */
const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,

  // Use SWC minifier instead of Terser for faster builds
  swcMinify: true,

  // Disable the X-Powered-By header for security
  poweredByHeader: false,

  // Enable gzip compression for better performance
  compress: true,

  // Disable source maps in production for better performance and smaller bundles
  productionBrowserSourceMaps: false,

  // Image optimization configuration
  images: {
    // Domains allowed for external images
    domains: [
      'revolucare-storage.vercel.app',
      'images.unsplash.com',
    ],
    // Supported image formats (modern formats first for better performance)
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables accessible on the client-side
  env: {
    NEXT_PUBLIC_BUILD_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // Internationalization configuration
  i18n: {
    // Supported locales
    locales: ['en', 'es'],
    // Default locale
    defaultLocale: 'en',
  },

  // Security headers for all routes
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://revolucare-storage.vercel.app https://images.unsplash.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.vercel-insights.com https://*.revolucare.com",
              "frame-src 'self'",
              "media-src 'self'",
            ].join('; '),
          },
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control iframe embedding
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (formerly Feature-Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Strict transport security for HTTPS enforcement
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // URL redirects for legacy routes or URL normalization
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/client/dashboard',
        permanent: false,
      },
      {
        source: '/profile',
        destination: '/account/profile',
        permanent: false,
      },
      // Redirect legacy API paths
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
        permanent: true,
      },
    ];
  },

  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Add additional optimizations for production
    if (!dev) {
      // Exclude certain dependency optimizations in node_modules
      config.resolve.alias = {
        ...config.resolve.alias,
        // Add any problematic packages to prevent optimization
      };
    }

    // Server-specific optimizations
    if (isServer) {
      // Server-side only optimizations
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable server actions for form handling
    serverActions: true,
    // External packages for server components
    serverComponentsExternalPackages: ['pdf-lib'],
    // Optimize CSS
    optimizeCss: true,
  },

  // Compiler options
  compiler: {
    // We're using Tailwind, so disable these
    styledComponents: false,
    emotion: false,
    // Remove console.log in production but keep errors and warnings
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },

  // ESLint configuration
  eslint: {
    // Don't run during builds (we handle this in CI)
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Don't ignore TypeScript errors during builds
    ignoreBuildErrors: false,
  },
};

// Export the configuration with bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig);