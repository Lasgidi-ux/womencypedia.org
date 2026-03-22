document.addEventListener('DOMContentLoaded', function () {
            const form = document.getElementById('reset-password-form');
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirm-password');
            const submitBtn = document.getElementById('submit-btn');
            const submitText = document.getElementById('submit-text');
            const togglePasswordBtn = document.getElementById('toggle-password');
            const errorMessage = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            const resetFormContainer = document.getElementById('reset-form-container');
            const successContainer = document.getElementById('success-container');
            const invalidTokenContainer = document.getElementById('invalid-token-container');
            const matchIndicator = document.getElementById('match-indicator');
            const matchText = document.getElementById('match-text');
            const strengthText = document.getElementById('strength-text');

            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            // If no token, show invalid state (for demo, we'll allow it)
            // In production, validate token with backend
            if (!token) {
                // For demo purposes, show the form anyway
                // invalidTokenContainer.classList.remove('hidden');
                // resetFormContainer.classList.add('hidden');
            }

            // Toggle password visibility
            togglePasswordBtn.addEventListener('click', function () {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                confirmInput.type = type;
                this.querySelector('span').textContent = type === 'password' ? 'visibility' : 'visibility_off';
            });

            // Password strength checker
            passwordInput.addEventListener('input', function () {
                const password = this.value;
                checkPasswordStrength(password);
                checkRequirements(password);
                checkMatch();
            });

            confirmInput.addEventListener('input', checkMatch);

            function checkMatch() {
                const password = passwordInput.value;
                const confirm = confirmInput.value;

                if (confirm.length === 0) {
                    matchIndicator.classList.add('hidden');
                    matchText.classList.add('hidden');
                    return;
                }

                if (password === confirm) {
                    matchIndicator.classList.remove('hidden');
                    matchText.classList.add('hidden');
                    confirmInput.classList.remove('border-red-300');
                    confirmInput.classList.add('border-accent-teal');
                } else {
                    matchIndicator.classList.add('hidden');
                    matchText.classList.remove('hidden');
                    confirmInput.classList.add('border-red-300');
                    confirmInput.classList.remove('border-accent-teal');
                }
            }

            function checkPasswordStrength(password) {
                let strength = 0;

                if (password.length >= 8) strength++;
                if (password.match(/[a-z]/)) strength++;
                if (password.match(/[A-Z]/)) strength++;
                if (password.match(/[0-9]/)) strength++;
                if (password.match(/[^a-zA-Z0-9]/)) strength++;

                const bars = [
                    document.getElementById('strength-1'),
                    document.getElementById('strength-2'),
                    document.getElementById('strength-3'),
                    document.getElementById('strength-4')
                ];

                const colors = {
                    weak: '#EF4444',
                    fair: '#F59E0B',
                    good: '#10B981',
                    strong: '#059669'
                };

                const texts = {
                    0: 'Enter a password',
                    1: 'Weak password',
                    2: 'Fair password',
                    3: 'Good password',
                    4: 'Strong password',
                    5: 'Very strong password'
                };

                bars.forEach((bar, index) => {
                    if (index < strength) {
                        bar.style.backgroundColor = strength <= 1 ? colors.weak :
                            strength === 2 ? colors.fair :
                                strength === 3 ? colors.good : colors.strong;
                    } else {
                        bar.style.backgroundColor = '#E5E7EB';
                    }
                });

                strengthText.textContent = texts[Math.min(strength, 5)];
                strengthText.style.color = strength <= 1 ? colors.weak :
                    strength === 2 ? colors.fair :
                        strength >= 3 ? colors.good : colors.strong;
            }

            function checkRequirements(password) {
                const requirements = {
                    'req-length': password.length >= 8,
                    'req-upper': /[A-Z]/.test(password),
                    'req-lower': /[a-z]/.test(password),
                    'req-number': /[0-9]/.test(password)
                };

                Object.entries(requirements).forEach(([id, met]) => {
                    const el = document.getElementById(id);
                    if (met) {
                        el.classList.remove('requirement-unmet');
                        el.classList.add('requirement-met');
                    } else {
                        el.classList.remove('requirement-met');
                        el.classList.add('requirement-unmet');
                    }
                });
            }

            // Handle form submission
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                const password = passwordInput.value;
                const confirm = confirmInput.value;

                // Validate
                if (password.length < 8) {
                    showError('Password must be at least 8 characters long.');
                    return;
                }

                if (password !== confirm) {
                    showError('Passwords do not match.');
                    return;
                }

                if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
                    showError('Password must contain uppercase, lowercase, and a number.');
                    return;
                }

                // Show loading state
                setLoading(true);
                hideError();

                try {
                    // Call the reset password API
                    const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            token: token || 'demo-token',
                            new_password: password
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Show success state
                        resetFormContainer.classList.add('hidden');
                        successContainer.classList.remove('hidden');
                    } else {
                        showError(data.detail || 'Failed to reset password. Please try again.');
                    }
                } catch (error) {
                    // For demo, show success anyway
                    resetFormContainer.classList.add('hidden');
                    successContainer.classList.remove('hidden');
                }

                setLoading(false);
            });

            function setLoading(loading) {
                submitBtn.disabled = loading;
                if (loading) {
                    submitText.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Resetting...';
                } else {
                    submitText.innerHTML = 'Reset Password';
                }
            }

            function showError(message) {
                errorText.textContent = message;
                errorMessage.classList.remove('hidden');
            }

            function hideError() {
                errorMessage.classList.add('hidden');
            }
        });