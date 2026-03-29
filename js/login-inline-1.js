// Toggle password visibility
        function togglePasswordVisibility(inputId) {
            const input = document.getElementById(inputId);
            const icon = input.nextElementSibling.querySelector('.material-symbols-outlined');
            const button = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility_off';
                button.setAttribute('aria-label', 'Hide password');
                button.setAttribute('aria-pressed', 'true');
            } else {
                input.type = 'password';
                icon.textContent = 'visibility';
                button.setAttribute('aria-label', 'Show password');
                button.setAttribute('aria-pressed', 'false');
            }
        }

        // Handle login form submission
        document.getElementById('login-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const form = e.target;
            const submitBtn = document.getElementById('login-submit');
            const errorDiv = document.getElementById('login-error');

            // Get form values
            const email = form.querySelector('[name="email"]').value.trim();
            const password = form.querySelector('[name="password"]').value;
            const remember = form.querySelector('[name="remember"]').checked;

            // Clear previous messages
            errorDiv.classList.add('hidden');

            // Validation
            const setError = (msg) => {
                const errorText = errorDiv.querySelector('.error-text');
                if (errorText) errorText.textContent = msg;
                else errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            };

            if (!email || !password) {
                setError('Please enter your email and password.');
                return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">refresh</span> Signing In...';

            try {
                // Call login API
                const result = await Auth.login(email, password);

                // Store remember me preference
                if (remember) {
                    localStorage.setItem('womencypedia_remember_email', email);
                } else {
                    localStorage.removeItem('womencypedia_remember_email');
                }

                // Redirect to home or previous page
                const redirectParam = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                // Validate redirect to prevent open-redirect attacks
                let redirectUrl;
                try {
                    const url = new URL(redirectParam, window.location.origin);
                    if (url.origin === window.location.origin && url.pathname.startsWith('/')) {
                        redirectUrl = url.pathname + url.search;
                    } else {
                        redirectUrl = 'index.html';
                    }
                } catch (e) {
                    redirectUrl = 'index.html';
                }
                window.location.href = redirectUrl;

            } catch (error) {
                setError(error.message || 'Login failed. Please check your credentials.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[24px]">login</span> Sign In';
            }
        });

        // Pre-fill email if remembered
        document.addEventListener('DOMContentLoaded', function () {
            const rememberedEmail = localStorage.getItem('womencypedia_remember_email');
            if (rememberedEmail) {
                document.getElementById('login-email').value = rememberedEmail;
                document.querySelector('[name="remember"]').checked = true;
            }

            // Redirect if already logged in
            if (Auth.isAuthenticated()) {
                const redirectMessage = document.createElement('div');
                redirectMessage.className = 'fixed inset-0 bg-white/90 z-[200] flex items-center justify-center';
                redirectMessage.innerHTML = `
                    <div class="text-center">
                        <span class="material-symbols-outlined text-primary text-5xl mb-4 block animate-spin">refresh</span>
                        <p class="text-text-main font-medium">You're already signed in. Redirecting...</p>
                    </div>
                `;
                document.body.appendChild(redirectMessage);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });