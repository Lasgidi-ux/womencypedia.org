// Tab navigation
        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.settings-section').forEach(el => {
                el.classList.add('hidden');
            });

            // Show selected section
            document.getElementById('section-' + section).classList.remove('hidden');

            // Update nav items
            document.querySelectorAll('.settings-nav-item').forEach(btn => {
                btn.classList.remove('active', 'text-text-main', 'border-primary', 'bg-primary/10');
                btn.classList.add('text-text-secondary', 'border-transparent');

                if (btn.dataset.section === section) {
                    btn.classList.add('active', 'text-text-main', 'border-primary', 'bg-primary/10');
                    btn.classList.remove('text-text-secondary', 'border-transparent');
                }
            });
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function () {
            // ALWAYS require authentication - security critical
            // Use Auth.protectPage() for consistent security
            if (!Auth.protectPage('user')) {
                return; // protectPage handles redirect
            }

            // Load user data
            loadUserData();
        });

        // Load user data
        function loadUserData() {
            const user = Auth.getUser();
            if (user) {
                // Update avatar initials
                const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'JD';
                document.getElementById('avatar-initials').textContent = initials;

                // Update form fields
                if (user.name) {
                    const nameParts = user.name.split(' ');
                    document.getElementById('firstName').value = nameParts[0] || '';
                    document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
                }
                if (user.email) {
                    document.getElementById('email').value = user.email;
                }
                if (user.bio) {
                    document.getElementById('bio').value = user.bio;
                }
                if (user.location) {
                    document.getElementById('location').value = user.location;
                }
            }
        }

        // Profile form submission
        document.getElementById('profile-form')?.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`.trim(),
                email: document.getElementById('email').value,
                bio: document.getElementById('bio').value,
                location: document.getElementById('location').value
            };

            // Show loading state
            const submitBtn = this.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                // In demo mode, just update local storage
                const currentUser = Auth._currentUser || {};
                const updatedUser = { ...currentUser, ...formData };
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
                Auth._currentUser = updatedUser;

                // Update avatar initials
                const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                document.getElementById('avatar-initials').textContent = initials;

                UI.showToast('Profile updated successfully!', 'success');
            } catch (error) {
                console.error('Profile update error:', error);
                UI.showToast('Failed to update profile', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        // Password form submission
        document.getElementById('password-form')?.addEventListener('submit', async function (e) {
            e.preventDefault();

            const currentPassword = this.querySelector('[name="currentPassword"]').value;
            const newPassword = this.querySelector('[name="newPassword"]').value;
            const confirmPassword = this.querySelector('[name="confirmPassword"]').value;

            if (newPassword !== confirmPassword) {
                UI.showToast('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 8) {
                UI.showToast('Password must be at least 8 characters', 'error');
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            try {
                // Demo mode - simulate password change
                await new Promise(resolve => setTimeout(resolve, 1000));

                UI.showToast('Password updated successfully!', 'success');
                this.reset();
            } catch (error) {
                console.error('Password update error:', error);
                UI.showToast('Failed to update password', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });