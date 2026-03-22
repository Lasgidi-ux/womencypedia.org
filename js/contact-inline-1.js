// Contact form validation
        document.addEventListener('DOMContentLoaded', function () {
            const contactForm = document.querySelector('.connect-form');
            if (contactForm) {
                contactForm.addEventListener('submit', function (e) {
                    e.preventDefault();

                    // Clear previous errors
                    document.querySelectorAll('.form-error').forEach(el => el.remove());
                    document.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

                    let isValid = true;
                    const formData = new FormData(contactForm);

                    // Validate required fields
                    const requiredFields = ['name', 'email', 'interest-area', 'subject', 'message'];
                    requiredFields.forEach(field => {
                        const input = contactForm.querySelector(`[name="${field}"]`);
                        if (!input || !input.value.trim()) {
                            isValid = false;
                            showFieldError(input, 'This field is required');
                        }
                    });

                    // Validate email format
                    const emailInput = contactForm.querySelector('[name="email"]');
                    if (emailInput && emailInput.value) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(emailInput.value)) {
                            isValid = false;
                            showFieldError(emailInput, 'Please enter a valid email address');
                        }
                    }

                    if (isValid) {
                        // Simulate form submission
                        const submitBtn = contactForm.querySelector('button[type="submit"]');
                        const originalText = submitBtn.innerHTML;
                        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Sending...';
                        submitBtn.disabled = true;

                        setTimeout(() => {
                            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> Message Sent!';
                            submitBtn.classList.add('bg-green-600');
                            submitBtn.classList.remove('bg-text-main');
                            contactForm.reset();

                            setTimeout(() => {
                                submitBtn.innerHTML = originalText;
                                submitBtn.disabled = false;
                                submitBtn.classList.remove('bg-green-600');
                                submitBtn.classList.add('bg-text-main');
                            }, 3000);
                        }, 1500);
                    }
                });

                function showFieldError(input, message) {
                    if (!input) return;
                    input.classList.add('border-red-500');
                    const error = document.createElement('div');
                    error.className = 'form-error text-red-500 text-xs mt-1';
                    error.textContent = message;
                    input.parentNode.appendChild(error);
                }
            }
        });