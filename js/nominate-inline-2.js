// CMS Health Check - Run on page load to diagnose connectivity issues
            (async function () {
                try {
                    const cmsUrl = window.API_STRAPI_URL || window.API_BASE_URL || 'https://womencypedia-cms.onrender.com';
                    console.log('[HealthCheck] Testing CMS connectivity:', cmsUrl);

                    const response = await fetch(`${cmsUrl}/api/contributions?pagination[limit]=1`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(10000)
                    });

                    if (response.ok) {
                        console.log('[HealthCheck] CMS is accessible - Status:', response.status);
                    } else {
                        console.warn('[HealthCheck] CMS returned error - Status:', response.status);
                    }
                } catch (error) {
                    console.error('[HealthCheck] CMS is not accessible:', error.message);
                    // Show warning to user
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'fixed top-4 right-4 z-50 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 max-w-md';
                    warningDiv.innerHTML = `
                        <div class="flex items-start">
                            <span class="material-symbols-outlined mr-2">warning</span>
                            <div>
                                <p class="font-bold">CMS Connection Issue</p>
                                <p class="text-sm">Unable to connect to the content management system. Form submissions may fail. Please try again later or contact support.</p>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(warningDiv);
                }
            })();