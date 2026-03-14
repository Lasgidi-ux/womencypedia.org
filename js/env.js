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
    // Use local Strapi for development, remote for production
    // Production Strapi is hosted on Render: https://womencypedia-cms.onrender.com
    // Override: Set FORCE_PRODUCTION=true in URL params to use production CMS on localhost
    const urlParams = new URLSearchParams(window.location.search);
    const forceProduction = urlParams.get('FORCE_PRODUCTION') === 'true';

    window.API_STRAPI_URL = (isDevelopment && !forceProduction)
        ? 'http://localhost:1337'
        : 'https://womencypedia-cms.onrender.com';

    // Payment Gateway Keys
    // Replace with your LIVE/TEST public keys
    window.PAYSTACK_PUBLIC_KEY = '';      // pk_live_xxx or pk_test_xxx
    window.FLUTTERWAVE_PUBLIC_KEY = '';   // FLWPUBK-xxx
    window.PAYSTACK_MONTHLY_PLAN = '';    // PLN_xxx (Paystack subscription plan code)
})();
