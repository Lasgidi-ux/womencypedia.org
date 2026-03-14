import type { Core } from '@strapi/strapi';

// Global reference to strapi instance
let strapiInstance: any = null;

// Custom API routes - manually registered to bypass Strapi's broken route loading
const customRoutes = [
  // Contribution routes
  {
    method: 'POST',
    path: '/api/contributions',
    handler: async (ctx: any, next: any) => {
      try {
        const rawBody = ctx.request.body || {};
        const body = rawBody.data ? rawBody.data : rawBody;

        const title = body.subjectName || body.title || 'Untitled Story';
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
        const type = body.type || 'story';
        const content = body.story || body.content || '';

        const entryData = {
          title: title,
          slug: slug,
          type: type,
          content: content,
          subjectName: body.subjectName || null,
          relationship: body.relationship || null,
          theme: body.theme || null,
          lessons: body.lessons || null,
          contactName: body.contactName || null,
          contactEmail: body.contactEmail || null,
          storyType: body.storyType || null,
          region: body.storyRegion || body.region || null,
          status: 'pending_review',
          submittedAt: new Date().toISOString(),
          permissionGranted: body.permission === true || body.permissionGranted === true,
        };

        const entry = await strapiInstance.entityService.create('api::contribution.contribution', {
          data: entryData,
        });
        ctx.body = { data: entry };
      } catch (err: any) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message, details: err.details } };
      }
    },
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/api/contributions',
    handler: async (ctx: any, next: any) => {
      try {
        const entries = await strapiInstance.entityService.findMany('api::contribution.contribution', {});
        ctx.body = { data: entries };
      } catch (err: any) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message } };
      }
    },
    config: {
      auth: false,
      policies: [],
    },
  },
  // Biography routes - list all with pagination
  {
    method: 'GET',
    path: '/api/biographies',
    handler: async (ctx: any, next: any) => {
      try {
        const page = parseInt(ctx.query.pagination?.page || '1');
        const pageSize = parseInt(ctx.query.pagination?.pageSize || '10');
        const locale = ctx.query.locale || 'en';

        const entries = await strapiInstance.entityService.findMany('api::biography.biography', {
          populate: '*',
          locale: locale,
          pagination: { page, pageSize },
        });

        const total = await strapiInstance.entityService.count('api::biography.biography', { locale });

        ctx.body = {
          data: entries,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount: Math.ceil(total / pageSize),
              total
            }
          }
        };
      } catch (err: any) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message } };
      }
    },
    config: {
      auth: false,
      policies: [],
    },
  },
  // Get single biography by ID or slug
  {
    method: 'GET',
    path: '/api/biographies/:idOrSlug',
    handler: async (ctx: any, next: any) => {
      try {
        const { idOrSlug } = ctx.params;
        const locale = ctx.query.locale || 'en';

        let entry;
        // Check if it's a numeric ID
        if (/^\d+$/.test(idOrSlug)) {
          entry = await strapiInstance.entityService.findOne('api::biography.biography', parseInt(idOrSlug), {
            populate: '*',
            locale: locale,
          });
        } else {
          // It's a slug - search by slug field
          const entries = await strapiInstance.entityService.findMany('api::biography.biography', {
            filters: { slug: idOrSlug },
            populate: '*',
            locale: locale,
            limit: 1
          });
          entry = entries && entries.length > 0 ? entries[0] : null;
        }

        if (!entry) {
          ctx.status = 404;
          ctx.body = { error: { message: 'Biography not found' } };
          return;
        }

        ctx.body = { data: entry };
      } catch (err: any) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message } };
      }
    },
    config: {
      auth: false,
      policies: [],
    },
  },
  // Nominations route
  {
    method: 'POST',
    path: '/api/nominations',
    handler: async (ctx: any, next: any) => {
      try {
        const rawBody = ctx.request.body || {};
        const body = rawBody.data ? rawBody.data : rawBody;

        const entryData = {
          nomineeName: body.name || body.nomineeName,
          nomineeEmail: body.email || body.nomineeEmail,
          nomineePhone: body.phone || body.nomineePhone,
          nomineeRegion: body.region || body.nomineeRegion || 'Global',
          nomineeCategory: body.category || body.collection || body.nomineeCategory || 'Other',
          nomineeEra: body.era || body.nomineeEra || 'Contemporary',
          reason: body.reason || body.nominationReason || body.bio,
          sources: body.sources || [],
          nominatorName: body.nominatorName || body.yourName,
          nominatorEmail: body.nominatorEmail || body.yourEmail,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        };

        const entry = await strapiInstance.entityService.create('api::nomination.nomination', {
          data: entryData,
        });
        ctx.body = { data: entry };
      } catch (err: any) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message, details: err.details } };
      }
    },
    config: {
      auth: false,
      policies: [],
    },
  },
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: any }) {
    // Register custom routes
    strapi.server.routes(customRoutes);
    strapi.log.info('[Custom Routes] Registered manual API routes');
  },

  /**
   * Bootstrap: auto-create locales and seed initial data
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Store strapi instance globally for use in routes
    strapiInstance = strapi;
    strapi.log.info('[Custom Routes] Strapi instance stored globally');
    // ── Auto-create locales matching the frontend locale files ──
    const localesToCreate = [
      { name: 'French', code: 'fr' },
      { name: 'Spanish', code: 'es' },
      { name: 'Portuguese', code: 'pt' },
      { name: 'Arabic', code: 'ar' },
      { name: 'Swahili', code: 'sw' },
      { name: 'Yoruba', code: 'yo' },
      { name: 'Hausa', code: 'ha' },
      { name: 'Hindi', code: 'hi' },
      { name: 'Chinese', code: 'zh' },
    ];

    try {
      const localeService = strapi.plugin('i18n')?.service('locales');
      if (!localeService) {
        strapi.log.warn('[Bootstrap] i18n plugin not found — skipping locale creation');
      } else {
        const existingLocales = await localeService.find();
        const existingCodes = existingLocales.map((l: any) => l.code);

        for (const locale of localesToCreate) {
          if (!existingCodes.includes(locale.code)) {
            strapi.log.info(`[Bootstrap] Creating locale: ${locale.name} (${locale.code})`);
            await localeService.create(locale);
          }
        }

        strapi.log.info(`[Bootstrap] Locales ready: ${existingLocales.length + localesToCreate.filter(l => !existingCodes.includes(l.code)).length} total`);
      }
    } catch (err) {
      strapi.log.error('[Bootstrap] Error auto-creating locales:', err);
    }

    // ── Set up public API permissions ──
    try {
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (!publicRole) {
        strapi.log.warn('[Bootstrap] Public role not found, skipping permissions setup');
      } else {
        strapi.log.info(`[Bootstrap] Found public role: ${publicRole.id}`);

        const publicContentTypes = [
          'api::biography.biography',
          'api::collection.collection',
          'api::education-module.education-module',
          'api::fellowship.fellowship',
          'api::leader.leader',
          'api::partner.partner',
          'api::tag.tag',
          'api::homepage.homepage',
        ];

        const publicSubmitContentTypes = [
          'api::contribution.contribution',
          'api::nomination.nomination',
          'api::contact-submission.contact-submission',
        ];

        const publicPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
          where: { role: publicRole.id },
        });

        strapi.log.info(`[Bootstrap] Current public permissions: ${publicPermissions.length}`);

        for (const contentType of publicContentTypes) {
          const existingFindPermission = publicPermissions.find(
            (p: any) => p.type === contentType && (p.action === 'find' || p.action === `${contentType}.find`)
          );

          if (!existingFindPermission) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: 'find',
                subject: contentType,
                role: publicRole.id,
                enabled: true,
              },
            });
            strapi.log.info(`[Bootstrap] Added find permission for ${contentType}`);
          }

          const existingFindOnePermission = publicPermissions.find(
            (p: any) => p.action === 'findOne' || p.action === `${contentType}.findOne`
          );
          if (!existingFindOnePermission) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: 'findOne',
                subject: contentType,
                role: publicRole.id,
                enabled: true,
              },
            });
            strapi.log.info(`[Bootstrap] Added findOne permission for ${contentType}`);
          }
        }

        for (const contentType of publicSubmitContentTypes) {
          const existingPerms = publicPermissions.filter(
            (p: any) => p.type === contentType
          );

          const shortAction = 'create';
          const fullAction = `${contentType}.create`;

          const hasShort = existingPerms.some((p: any) => p.action === shortAction);
          const hasFull = existingPerms.some((p: any) => p.action === fullAction);

          if (!hasShort) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: shortAction,
                subject: contentType,
                role: publicRole.id,
                enabled: true,
              },
            });
            strapi.log.info(`[Bootstrap] Added ${shortAction} permission for ${contentType} (public)`);
          }

          if (!hasFull) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: fullAction,
                subject: contentType,
                role: publicRole.id,
                enabled: true,
              },
            });
            strapi.log.info(`[Bootstrap] Added ${fullAction} permission for public`);
          }
        }

        const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
        });

        if (authenticatedRole) {
          const authContentTypes = [
            'api::contribution.contribution',
            'api::nomination.nomination',
            'api::contact-submission.contact-submission',
            'api::comment.comment',
            'api::saved-entry.saved-entry',
          ];

          const authPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
            where: { role: authenticatedRole.id },
          });

          for (const contentType of authContentTypes) {
            const existingCreatePermission = authPermissions.find(
              (p: any) => p.type === contentType && (p.action === 'create' || p.action === `${contentType}.create`)
            );

            if (!existingCreatePermission) {
              await strapi.query('plugin::users-permissions.permission').create({
                data: {
                  action: 'create',
                  subject: contentType,
                  role: authenticatedRole.id,
                  enabled: true,
                },
              });
              strapi.log.info(`[Bootstrap] Added create permission for ${contentType} (authenticated)`);
            }
          }

          // Add upload permissions for authenticated role
          const authUploadActions = [
            'upload',
            'plugin::upload.content-api.upload',
            'plugin::upload.assets.create',
          ];

          for (const action of authUploadActions) {
            const existingPerm = authPermissions.find(
              (p: any) => p.action === action
            );
            if (!existingPerm) {
              await strapi.query('plugin::users-permissions.permission').create({
                data: {
                  action: action,
                  subject: null,
                  role: authenticatedRole.id,
                  enabled: true,
                },
              });
              strapi.log.info(`[Bootstrap] Added upload permission: ${action} for authenticated`);
            }
          }
        }

        strapi.log.info('[Bootstrap] Public API permissions configured successfully');
      }
    } catch (err) {
      strapi.log.error('[Bootstrap] Error setting up permissions:', err);
    }
  },
};
