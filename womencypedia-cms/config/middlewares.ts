import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'res.cloudinary.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (() => {
        const isProduction = process.env.NODE_ENV === 'production';
        const baseOrigins = [
          'https://womencypedia.org',
          'https://www.womencypedia.org',
          'https://kehindeisa.onrender.com',
          'https://womencypedia-org.onrender.com',
          'https://womencypedia-cms.onrender.com',
        ];

        // Add HTTP origins only in non-production environments
        if (!isProduction) {
          baseOrigins.push(
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://womencypedia.org',
            'http://www.womencypedia.org'
          );
        }

        return baseOrigins;
      })(),
      // Note: HTTPS is enforced at the routing/proxy level. HTTP requests should be redirected to HTTPS.
      // HTTP origins are only included in non-production environments (development/staging).
      // Production builds only contain HTTPS origins to ensure secure communications.
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
