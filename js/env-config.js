/**
 * Womencypedia Environment Configuration
 * 
 * This file sets environment variables for the Womencypedia frontend.
 * Include this script BEFORE js/config.js in your HTML files.
 * 
 * Usage:
 * <script src="js/env-config.js"></script>
 * <script src="js/config.js"></script>
 * 
 * Or set values directly in your HTML:
 * <script>
 *     window.API_TOKEN = 'your-api-token-here';
 *     window.CONTACT_EMAIL = 'rev@womencypedia.org';
 * </script>
 * <script src="js/config.js"></script>
 */

(function () {
    'use strict';

    // ============================================
    // API TOKEN CONFIGURATION
    // ============================================
    // Set your Strapi API token here
    // Get your token from: Strapi Admin → Settings → API Tokens
    // 
    // IMPORTANT: If Strapi Public role is not enabled,
    // API requests will fail without a valid token.
    // 
    // To enable Public role:
    // 1. Log in to Strapi admin: https://womencypedia-cms.onrender.com/admin
    // 2. Go to Settings → Users & Permissions Plugin → Roles
    // 3. Click Public role
    // 4. Enable permissions for content types you want to access
    // 5. Click Save

    if (typeof window.API_TOKEN === 'undefined') {
        // Set your API token here (leave empty if Public role is enabled)
        window.API_TOKEN = '';

        // Uncomment and set your token:
        // window.API_TOKEN = 'your-strapi-api-token-here';
    }

    // ============================================
    // CONTACT EMAIL CONFIGURATION
    // ============================================
    // Default contact email for form submissions
    // This email is used when users submit the contact form

    if (typeof window.CONTACT_EMAIL === 'undefined') {
        window.CONTACT_EMAIL = 'rev@womencypedia.org';
    }

    // ============================================
    // ADDITIONAL ENVIRONMENT VARIABLES
    // ============================================
    // Add more environment variables as needed

    // Payment Gateway Keys (optional)
    // if (typeof window.PAYSTACK_PUBLIC_KEY === 'undefined') {
    //     window.PAYSTACK_PUBLIC_KEY = '';
    // }

    // if (typeof window.FLUTTERWAVE_PUBLIC_KEY === 'undefined') {
    //     window.FLUTTERWAVE_PUBLIC_KEY = '';
    // }

    // ============================================
    // DEBUG MODE (optional)
    // ============================================
    // Set to true to enable console logging
    if (typeof window.DEBUG_MODE === 'undefined') {
        window.DEBUG_MODE = false;
    }

    // Log configuration status (only in debug mode)
    if (window.DEBUG_MODE) {
        console.log('[ENV] API_TOKEN:', window.API_TOKEN ? '(set)' : '(not set)');
        console.log('[ENV] CONTACT_EMAIL:', window.CONTACT_EMAIL || '(not set)');
    }
})();
