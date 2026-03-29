/**
 * Womencypedia Email Update Script
 * 
 * This script dynamically updates email addresses on all pages
 * to use the configurable contact email from CONFIG.CONTACT_EMAIL.
 * 
 * Include this script AFTER js/config.js in your HTML files:
 * <script src="js/config.js"></script>
 * <script src="js/update-emails.js"></script>
 * 
 * Or include js/env-config.js before js/config.js:
 * <script src="js/env-config.js"></script>
 * <script src="js/config.js"></script>
 * <script src="js/update-emails.js"></script>
 */

(function () {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function () {
        // Get contact email from CONFIG or use default
        const contactEmail = typeof CONFIG !== 'undefined' ? CONFIG.CONTACT_EMAIL : 'rev@womencypedia.org';

        // Update all mailto links
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('@womencypedia.org')) {
                // Keep the subject line if present
                const subjectMatch = href.match(/\?subject=([^&]*)/);
                const subject = subjectMatch ? subjectMatch[1] : '';
                const newHref = `mailto:${contactEmail}${subject ? '?subject=' + subject : ''}`;
                link.setAttribute('href', newHref);

                // Update link text if it's an email address
                const linkText = link.textContent.trim();
                if (linkText.includes('@womencypedia.org')) {
                    link.textContent = contactEmail;
                }
            }
        });

        // Update email placeholders in forms
        const emailInputs = document.querySelectorAll('input[type="email"][placeholder*="example.com"]');
        emailInputs.forEach(input => {
            // Keep existing placeholder, just ensure it's user-friendly
            if (!input.placeholder || input.placeholder === 'you@example.com') {
                input.placeholder = 'you@example.com';
            }
        });

        // Update any text content that contains womencypedia.org emails
        const textNodes = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = textNodes.nextNode()) {
            const text = node.textContent;
            if (text && text.includes('@womencypedia.org')) {
                // Replace womencypedia.org emails with contact email
                const updatedText = text.replace(
                    /[a-zA-Z0-9._%+-]+@womencypedia\.org/g,
                    contactEmail
                );
                if (updatedText !== text) {
                    node.textContent = updatedText;
                }
            }
        }

        // Log update (only in debug mode)
        if (typeof window !== 'undefined' && window.DEBUG_MODE) {
            console.log('[UPDATE-EMAILS] Email addresses updated to:', contactEmail);
        }
    });
})();
