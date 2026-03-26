/**
 * Womencypedia — Frontend Environment Variables
 * 
 * This file provides client-side "env vars" by setting window globals
 * BEFORE config.js loads. Place this script tag BEFORE js/config.js.
 * 
 * For production, replace the placeholder values with your real keys.
 * 
 * Payment Gateway Setup:
 *   Paystack:     https://dashboard.paystack.com/#/settings/developers
 *   Flutterwave:  https://app.flutterwave.com/dashboard/settings/apis
 * 
 * Usage in HTML:
 *   <script src="js/env.js"></script>
 *   <script src="js/config.js"></script>
 */

(function () {
    // Determine if we're in development mode
    // Check for common development indicators
    const isDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local');

    // Strapi CMS URL
    // Production Strapi is hosted on Render: https://womencypedia-cms.onrender.com
    // Default to production URL to avoid connection errors when local Strapi is not running
    // To use local Strapi, set FORCE_LOCAL=true in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const forceLocal = urlParams.get('FORCE_LOCAL') === 'true';

    window.API_STRAPI_URL = (isDevelopment && forceLocal)
        ? 'http://localhost:1337'
        : 'https://womencypedia-cms.onrender.com';

    // Strapi API Token
    // IMPORTANT: Set this to your Strapi API token for authenticated requests
    // You can generate a token in Strapi Admin Panel -> Settings -> API Tokens
    // Leave empty if Public role is enabled in Strapi (allows unauthenticated access)
    window.API_TOKEN = '';  // Add your token here: 'your-strapi-api-token-here'

    // Payment Gateway Keys
    // Replace with your LIVE/TEST public keys
    window.PAYSTACK_PUBLIC_KEY = '';      // pk_live_xxx or pk_test_xxx
    window.FLUTTERWAVE_PUBLIC_KEY = '';   // FLWPUBK-xxx
    window.PAYSTACK_MONTHLY_PLAN = '';    // PLN_xxx (Paystack subscription plan code)
})();
