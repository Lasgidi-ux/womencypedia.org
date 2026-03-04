'use strict';

/**
 * nomination service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nomination.nomination');
