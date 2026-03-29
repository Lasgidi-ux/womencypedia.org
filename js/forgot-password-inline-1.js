document.addEventListener('DOMContentLoaded', function () {
            const form = document.getElementById('forgot-password-form');
            const emailInput = document.getElementById('email');
            const submitBtn = document.getElementById('submit-btn');
            const submitText = document.getElementById('submit-text');
            const errorMessage = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            const requestContainer = document.getElementById('request-form-container');
            const successContainer = document.getElementById('success-container');
            const sentEmailSpan = document.getElementById('sent-email');
            const resendBtn = document.getElementById('resend-btn');

            // Handle form submission
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                const email = emailInput.value.trim();

                if (!email) {
                    showError('Please enter your email address.');
                    return;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showError('Please enter a valid email address.');
                    return;
                }

                // Show loading state
                setLoading(true);
                hideError();

                try {
                    // Call the forgot password API
                    const result = await Auth.forgotPassword(email);

                    // Show success state
                    sentEmailSpan.textContent = email;
                    requestContainer.classList.add('hidden');
                    successContainer.classList.remove('hidden');

                } catch (error) {
                    // Even if user doesn't exist, we show success for security
                    // This prevents email enumeration attacks
                    sentEmailSpan.textContent = email;
                    requestContainer.classList.add('hidden');
                    successContainer.classList.remove('hidden');
                }

                setLoading(false);
            });

            // Handle resend button
            resendBtn.addEventListener('click', async function () {
                const email = sentEmailSpan.textContent;

                // Disable button temporarily
                resendBtn.disabled = true;
                resendBtn.innerHTML = `
                    <span class="material-symbols-outlined text-[20px] animate-spin">sync</span>
                    Sending...
                `;

                try {
                    await Auth.forgotPassword(email);

                    // Show toast notification
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Reset email sent again!', 'success');
                    } else {
                        alert('Reset email sent again!');
                    }
                } catch (error) {
                    // Still show success for security
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Reset email sent again!', 'success');
                    }
                }

                // Re-enable button after delay
                setTimeout(() => {
                    resendBtn.disabled = false;
                    resendBtn.innerHTML = `
                        <span class="material-symbols-outlined text-[20px]">refresh</span>
                        Resend Email
                    `;
                }, 3000);
            });

            function setLoading(loading) {
                submitBtn.disabled = loading;
                if (loading) {
                    submitText.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Sending...';
                } else {
                    submitText.innerHTML = 'Send Reset Link';
                }
            }

            function showError(message) {
                errorText.textContent = message;
                errorMessage.classList.remove('hidden');
            }

            function hideError() {
                errorMessage.classList.add('hidden');
            }

            // Check for email parameter in URL (from login page redirect)
            const urlParams = new URLSearchParams(window.location.search);
            const emailParam = urlParams.get('email');
            if (emailParam) {
                emailInput.value = emailParam;
            }
        });