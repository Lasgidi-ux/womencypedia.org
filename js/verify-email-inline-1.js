// Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // Show appropriate state based on token
        function showState(state) {
            ['loading-state', 'success-state', 'error-state', 'expired-state', 'initial-state'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
            document.getElementById(state + '-state').classList.remove('hidden');
        }

        // Verify email with token
        async function verifyEmail(token) {
            showState('loading');

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                if (response.ok) {
                    showState('success');
                } else {
                    const error = await response.json();
                    if (error.detail?.includes('expired')) {
                        showState('expired');
                    } else {
                        document.getElementById('error-message').textContent = error.detail || 'Verification failed. Please try again.';
                        showState('error');
                    }
                }
            } catch (error) {
                console.error('Verification error:', error);
                // Only show success in demo mode
                const isDemo = typeof window.DEMO_MODE !== 'undefined' || new URLSearchParams(window.location.search).has('demo');
                if (isDemo) {
                    showState('success');
                } else {
                    showState('error');
                }
            }
        }

        // Resend verification email
        async function resendVerification() {
            const user = Auth.getUser();
            const email = user?.email || localStorage.getItem('pending_verification_email');

            if (!email) {
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Please log in first to resend verification email', 'error');
                } else {
                    alert('Please log in first to resend verification email');
                }
                window.location.href = 'index.html?auth=login';
                return;
            }

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION || '/auth/resend-verification'}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Verification email sent! Check your inbox.', 'success');
                    } else {
                        alert('Verification email sent! Check your inbox.');
                    }
                } else {
                    throw new Error('Failed to send email');
                }
            } catch (error) {
                console.error('Resend error:', error);
                // Only show success message in demo mode
                const isDemo = typeof window.DEMO_MODE !== 'undefined' || new URLSearchParams(window.location.search).has('demo');
                if (isDemo) {
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Verification email sent! (Demo mode)', 'success');
                    } else {
                        alert('Verification email sent! (Demo mode)');
                    }
                } else {
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Failed to send verification email. Please try again.', 'error');
                    } else {
                        alert('Failed to send verification email. Please try again.');
                    }
                }
            }
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function () {
            if (token) {
                verifyEmail(token);
            } else {
                showState('initial');
            }
        });