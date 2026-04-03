/**
 * API Verification Script for Womencypedia
 *
 * This script tests if Strapi API endpoints are accessible after enabling Public role permissions.
 * Run this in the browser console on any Womencypedia page to verify API connectivity.
 *
 * Usage:
 * 1. Open any Womencypedia page in browser
 * 2. Open browser console (F12)
 * 3. Run: APIVerifier.runAllTests()
 * 4. Check results - all should return 200 for dynamic content to work
 */

const APIVerifier = {
    baseURL: 'https://womencypedia-cms.onrender.com/api',

    async testEndpoint(endpoint, description) {
        try {
            console.log(`Testing ${description}...`);
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${description}: SUCCESS (${response.status})`);
                console.log(`   Response has ${data.data ? data.data.length : 'unknown'} items`);
                return true;
            } else {
                console.log(`❌ ${description}: FAILED (${response.status}) - ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ ${description}: ERROR - ${error.message}`);
            return false;
        }
    },

    async runAllTests() {
        console.log('🔍 Starting Womencypedia API Verification...\n');

        const tests = [
            ['/biographies?pagination[pageSize]=1', 'Biographies endpoint'],
            ['/collections?pagination[pageSize]=1', 'Collections endpoint'],
            ['/homepage', 'Homepage single type'],
            ['/education-modules?pagination[pageSize]=1', 'Education modules'],
            ['/leaders?pagination[pageSize]=1', 'Leaders endpoint'],
            ['/tags?pagination[pageSize]=1', 'Tags endpoint']
        ];

        let passed = 0;
        let total = tests.length;

        for (const [endpoint, description] of tests) {
            if (await this.testEndpoint(endpoint, description)) {
                passed++;
            }
            console.log(''); // Empty line between tests
        }

        console.log(`📊 Results: ${passed}/${total} endpoints accessible`);

        if (passed === total) {
            console.log('🎉 All API endpoints are working! Dynamic content should now load.');
        } else if (passed > 0) {
            console.log('⚠️ Some endpoints are working. Check Strapi permissions for missing ones.');
        } else {
            console.log('🚫 No API endpoints are accessible. Enable Public role permissions in Strapi admin.');
            console.log('   Go to: Settings → Users & Permissions Plugin → Roles → Public');
        }

        return passed === total;
    }
};

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
    console.log('💡 Run APIVerifier.runAllTests() to verify API connectivity');
    // Uncomment the next line to auto-run on page load
    // APIVerifier.runAllTests();
}