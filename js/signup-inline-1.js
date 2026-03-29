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

        // Show login modal
        function showLoginModal() {
            document.getElementById('login-modal').classList.remove('hidden');
        }

        // Handle signup form submission
        document.getElementById('signup-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const form = e.target;
            const submitBtn = document.getElementById('signup-submit');
            const errorDiv = document.getElementById('signup-error');
            const successDiv = document.getElementById('signup-success');

            // Get form values
            const name = form.querySelector('[name="name"]').value.trim();
            const email = form.querySelector('[name="email"]').value.trim();
            const password = form.querySelector('[name="password"]').value;
            const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
            const intent = form.querySelector('[name="intent"]:checked')?.value || 'reader';
            const agreeTerms = form.querySelector('[name="agreeTerms"]').checked;

            // Clear previous messages
            errorDiv.classList.add('hidden');
            successDiv.classList.add('hidden');

            // Validation
            const setError = (msg) => {
                const errorText = errorDiv.querySelector('.error-text');
                if (errorText) errorText.textContent = msg;
                else errorDiv.textContent = msg;
                errorDiv.classList.remove('hidden');
            };

            if (!name || !email || !password || !confirmPassword) {
                setError('Please fill in all required fields.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            if (password.length < 8) {
                setError('Password must be at least 8 characters long.');
                return;
            }

            if (!agreeTerms) {
                setError('You must agree to the Terms of Use and Privacy Policy.');
                return;
            }

            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">refresh</span> Creating Account...';

            try {
                // Call register API
                const result = await Auth.register({
                    name: name,
                    email: email,
                    password: password,
                    role: intent === 'contributor' ? 'contributor' : 'public'
                });

                // Show success message
                const successText = successDiv.querySelector('.success-text');
                if (successText) {
                    successText.textContent = 'Account created successfully! Redirecting...';
                } else {
                    successDiv.textContent = 'Account created successfully! Redirecting...';
                }
                successDiv.classList.remove('hidden');
                form.reset();

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (error) {
                setError(error.message || 'Registration failed. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">person_add</span> Create Account';
            }
        });

        // Redirect if already logged in
        document.addEventListener('DOMContentLoaded', function () {
            if (Auth.isAuthenticated()) {
                const redirectMessage = document.createElement('div');
                redirectMessage.className = 'fixed inset-0 bg-white/90 z-[200] flex items-center justify-center';
                redirectMessage.innerHTML = `
                    <div class="text-center">
                        <span
                            class="material-symbols-outlined text-primary text-5xl mb-4 block animate-spin">refresh</span>
                        <p class="text-text-main font-medium">You're already signed in. Redirecting...</p>
                    </div>
                    `;
                document.body.appendChild(redirectMessage);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });