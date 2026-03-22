// Form submission
        document.getElementById('contribution-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);

            const submissionData = {
                title: formData.get('title'),
                type: formData.get('contentType'),
                excerpt: formData.get('excerpt'),
                content: formData.get('content'),
                authorName: formData.get('authorName'),
                authorEmail: formData.get('authorEmail'),
                authorBio: formData.get('authorBio'),
                country: formData.get('country'),
                sector: formData.get('sector'),
                relatedLeader: formData.get('relatedLeader'),
                status: 'pending_review',
                submittedAt: new Date().toISOString()
            };

            try {
                // Try to submit to API
                if (typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/contributions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: submissionData })
                    });

                    if (response.ok) {
                        showSuccess();
                        return;
                    }
                }

                // Fallback
                console.log('Contribution submitted:', submissionData);
                localStorage.setItem('contribution_submission', JSON.stringify(submissionData));
                showSuccess();

            } catch (error) {
                console.error('Submission error:', error);
                showSuccess();
            }
        });

        function showSuccess() {
            document.getElementById('contribution-form').classList.add('hidden');
            document.getElementById('success-message').classList.remove('hidden');
        }