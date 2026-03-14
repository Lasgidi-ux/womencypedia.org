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
          'connect-src': process.env.NODE_ENV === 'production'
            ? ["'self'", 'https:']
            : ["'self'", 'https:', 'http:'], 'img-src': [
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
          'script-src': ["'self'", "'unsafe-eval'", 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://womencypedia.org',
        'https://www.womencypedia.org',
        'https://kehindeisa.onrender.com',
        'https://womencypedia-org.onrender.com',
        'https://womencypedia-cms.onrender.com',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://womencypedia.org',
        'http://www.womencypedia.org'
      ],
      // Note: HTTPS is enforced at the routing/proxy level. HTTP requests should be redirected to HTTPS.
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
