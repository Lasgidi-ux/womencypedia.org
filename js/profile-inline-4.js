document.addEventListener('DOMContentLoaded', async () => {
            // ALWAYS require authentication - security critical
            // Use Auth.protectPage() for consistent security
            if (!Auth.protectPage('user')) {
                return; // protectPage handles redirect
            }

            // Populate profile with real user data
            const user = Auth.getUser();
            if (user) {
                const nameEl = document.getElementById('profile-name');
                const emailEl = document.getElementById('profile-email');
                const avatarContainer = document.getElementById('profile-avatar-container');
                const roleEl = document.getElementById('profile-role');

                const displayName = user.name || user.email.split('@')[0];

                if (nameEl) nameEl.textContent = displayName;
                if (emailEl) emailEl.textContent = user.email;

                if (avatarContainer) {
                    // Use text initial rather than icon
                    avatarContainer.innerHTML = '';
                    avatarContainer.textContent = displayName.charAt(0).toUpperCase();
                }

                if (roleEl) {
                    const role = user.role || 'Member';
                    roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                    roleEl.classList.remove('hidden');
                }

                // Load user data into settings form
                const settingsName = document.getElementById('settings-name');
                const settingsEmail = document.getElementById('settings-email');
                if (settingsName) settingsName.value = user.name || '';
                if (settingsEmail) settingsEmail.value = user.email || '';
            }
        });

        // Logout handler
        function handleLogout() {
            if (confirm('Are you sure you want to sign out?')) {
                // Clear all auth data
                localStorage.removeItem('womencypedia_access_token');
                localStorage.removeItem('womencypedia_refresh_token');
                localStorage.removeItem('womencypedia_user');
                sessionStorage.clear();

                // Show toast if available
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('You have been signed out successfully', 'success');
                }

                // Redirect to homepage
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
        }

        // Avatar upload handler
        function handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Please select an image file (JPEG, PNG, GIF)', 'error');
                } else {
                    alert('Please select an image file (JPEG, PNG, GIF)');
                }
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast('Image must be smaller than 5MB', 'error');
                } else {
                    alert('Image must be smaller than 5MB');
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const avatarContainer = document.getElementById('profile-avatar-container');
                if (avatarContainer) {
                    avatarContainer.innerHTML = '';
                    avatarContainer.style.padding = '0';
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Profile avatar';
                    img.className = 'w-full h-full object-cover';
                    avatarContainer.appendChild(img);

                    // Persist to localStorage
                    try {
                        localStorage.setItem('womencypedia_avatar', e.target.result);
                    } catch (err) {
                        console.warn('[Profile] Avatar too large to store in localStorage');
                    }

                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Profile photo updated!', 'success');
                    }
                }
            };
            reader.readAsDataURL(file);
        }

        // Restore saved avatar on load
        (function restoreAvatar() {
            const savedAvatar = localStorage.getItem('womencypedia_avatar');
            if (savedAvatar) {
                const avatarContainer = document.getElementById('profile-avatar-container');
                if (avatarContainer) {
                    avatarContainer.innerHTML = '';
                    avatarContainer.style.padding = '0';
                    const img = document.createElement('img');
                    img.src = savedAvatar;
                    img.alt = 'Profile avatar';
                    img.className = 'w-full h-full object-cover';
                    avatarContainer.appendChild(img);
                }
            }
        })();

        // Tab switching function
        function showTab(tabName) {
            const tabs = document.querySelectorAll('.flex.border-b button');
            const settingsSection = document.getElementById('settings-section');
            const mainContent = document.getElementById('my-biographies');
            const badgesSection = document.querySelector('.mt-8:has(.grid.sm\\:grid-cols-2.lg\\:grid-cols-4)');

            // Reset all tab styles
            tabs.forEach(tab => {
                tab.className = 'flex-1 px-6 py-4 text-sm font-medium text-text-secondary hover:text-text-main hover:bg-lavender-soft/10 transition-colors';
            });

            if (tabName === 'settings') {
                // Show settings, hide main content
                settingsSection.classList.remove('hidden');
                if (mainContent) mainContent.classList.add('hidden');
                if (badgesSection) badgesSection.classList.add('hidden');

                // Highlight settings tab
                tabs[4].className = 'flex-1 px-6 py-4 text-sm font-medium text-primary border-b-2 border-primary bg-lavender-soft/30';
            } else {
                // Hide settings, show main content
                settingsSection.classList.add('hidden');
                if (mainContent) mainContent.classList.remove('hidden');
                if (badgesSection) badgesSection.classList.remove('hidden');

                // Highlight first tab
                tabs[0].className = 'flex-1 px-6 py-4 text-sm font-medium text-primary border-b-2 border-primary bg-lavender-soft/30';
            }
        }

        // Password change modal
        function openPasswordModal() {
            // Create modal dynamically
            const modal = document.createElement('div');
            modal.id = 'password-modal';
            modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl max-w-md w-full p-8 relative">
                    <button onclick="closePasswordModal()" class="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors">
                        <span class="material-symbols-outlined text-text-secondary">close</span>
                    </button>
                    <div class="text-center mb-6">
                        <div class="size-16 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
                            <span class="material-symbols-outlined text-accent-gold text-3xl">lock</span>
                        </div>
                        <h2 class="font-serif text-2xl font-bold text-text-main" data-i18n="profile.changePassword">Change Password</h2>
                        <p class="text-text-secondary text-sm mt-2">Enter your current and new password</p>
                    </div>
                    <form id="password-form" class="space-y-4" onsubmit="handlePasswordChange(event)">
                        <div>
                            <label class="block text-sm font-semibold text-text-main mb-2">Current Password</label>
                            <input type="password" id="current-password" required class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-text-main mb-2">New Password</label>
                            <input type="password" id="new-password" required minlength="8" class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-text-main mb-2">Confirm New Password</label>
                            <input type="password" id="confirm-password" required class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal">
                        </div>
                        <button type="submit" class="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[20px]">lock_reset</span>
                            Update Password
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }

        function closePasswordModal() {
            const modal = document.getElementById('password-modal');
            if (modal) modal.remove();
        }

        function handlePasswordChange(event) {
            event.preventDefault();
            const newPass = document.getElementById('new-password').value;
            const confirmPass = document.getElementById('confirm-password').value;

            if (newPass !== confirmPass) {
                alert('Passwords do not match!');
                return;
            }

            // Simulate password change
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Password updated successfully!', 'success');
            } else {
                alert('Password updated successfully!');
            }
            closePasswordModal();
        }

        // Handle profile form submission
        document.getElementById('edit-profile-form')?.addEventListener('submit', function (e) {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Profile updated successfully!', 'success');
            } else {
                alert('Profile updated successfully!');
            }
        });