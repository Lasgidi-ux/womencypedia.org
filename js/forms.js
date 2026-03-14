/**
 * Form Handler for Womencypedia Contribution Forms
 * Handles submission of nominations and stories with validation, media upload, and API integration.
 *
 * Dependencies: config.js (CONFIG), auth.js (Auth), ui.js (UI)
 * Optional: strapi-api.js (StrapiAPI), api.js (API)
 */

// Ensure API object exists - define a fallback if not loaded
if (typeof API === 'undefined') {
    console.warn('[Forms] API object not found - defining fallback');
    window.API = {
        isUsingStrapi: () => false,
        isUsingMockAPI: () => false,
        request: async () => { throw new Error('API not initialized'); }
    };
}

const FormHandler = {
    /**
     * Initialize form handlers
     */
    init() {
        console.log('[Forms] init() called');
        console.log('[Forms] story-form exists:', !!document.getElementById('story-form'));
        this.setupNominationForm();
        this.setupStoryForm();
    },

    /**
     * Set up nomination form handler
     */
    setupNominationForm() {
        const form = document.getElementById('nomination-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleNominationSubmit(form);
        });
    },

    /**
     * Set up story form handler
     */
    setupStoryForm() {
        const form = document.getElementById('story-form');
        console.log('[Forms] setupStoryForm called, form element:', form);
        if (!form) {
            console.log('[Forms] story-form not found on this page');
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleStorySubmit(form);
        });
    },

    /**
     * Upload media files to Strapi media library
     * @param {FileList} files - Files to upload
     * @param {string} token - Auth token (optional)
     * @returns {Promise<number[]>} - Array of uploaded file IDs
     */
    async uploadMediaFiles(files, token) {
        if (!files || files.length === 0) return [];

        // Allowed MIME types for images
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        const uploadedIds = [];

        for (const file of files) {
            // Validate file type (MIME type) - security measure
            if (!allowedTypes.includes(file.type)) {
                console.warn(`File "${file.name}" has invalid type "${file.type}". Allowed: jpeg, png, gif, webp, svg`);
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast(`File "${file.name}" has an invalid format. Allowed: JPEG, PNG, GIF, WebP, SVG`, 'warning');
                }
                continue;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                console.warn(`File "${file.name}" exceeds 10MB limit, skipping`);
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast(`File "${file.name}" exceeds 10MB limit`, 'warning');
                }
                continue;
            }

            const formData = new FormData();
            formData.append('files', file);

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (response.ok) {
                    const uploadedFiles = await response.json();
                    if (uploadedFiles && uploadedFiles.length > 0) {
                        uploadedIds.push(uploadedFiles[0].id);
                    }
                } else {
                    console.warn(`Failed to upload "${file.name}":`, response.status);
                }
            } catch (error) {
                console.warn(`Error uploading "${file.name}":`, error);
            }
        }

        return uploadedIds;
    },

    /**
     * Handle nomination form submission
     * Submits to /api/nominations (separate content type)
     * @param {HTMLFormElement} form
     */
    async handleNominationSubmit(form) {
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        // Collect form data — map to Strapi nomination schema fields
        const formData = {
            nomineeName: form.querySelector('#nomineeName')?.value || '',
            nomineeEra: form.querySelector('#era')?.value || '',
            nomineeRegion: form.querySelector('#region')?.value || '',
            nomineeCategory: form.querySelector('#collection')?.value || '',
            reason: form.querySelector('#bio')?.value || '',
            sources: form.querySelector('#sources')?.value ? [form.querySelector('#sources').value] : [],
            nominatorName: form.querySelector('#yourName')?.value || '',
            nominatorEmail: form.querySelector('#yourEmail')?.value || '',
            status: 'pending'
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin">refresh</span>
            Submitting...
        `;

        try {
            console.log('[NominationForm] Starting submission...');
            console.log('[NominationForm] CONFIG available:', typeof CONFIG !== 'undefined');
            console.log('[NominationForm] CONFIG.API_BASE_URL:', CONFIG?.API_BASE_URL);

            const token = (typeof Auth !== 'undefined' && Auth.isAuthenticated()) ? Auth.getAccessToken() : null;
            console.log('[NominationForm] Auth available:', typeof Auth !== 'undefined');
            console.log('[NominationForm] Token available:', !!token);

            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Check if CONFIG is available
            if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) {
                throw new Error('Configuration not loaded. Please refresh the page and try again.');
            }

            console.log('[NominationForm] Submitting to:', `${CONFIG.API_BASE_URL}/api/nominations`);

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/nominations`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ data: formData })
            });

            console.log('[NominationForm] Response status:', response.status);
            console.log('[NominationForm] Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('[NominationForm] Error data:', errorData);
                // Provide more helpful error messages for common issues
                if (response.status === 404) {
                    throw new Error('Unable to submit nomination. The server endpoint /api/nominations was not found. This may indicate the CMS needs to be rebuilt.');
                } if (response.status === 401) {
                    throw new Error('Please sign in to submit a nomination.');
                }
                if (response.status === 403) {
                    throw new Error('You do not have permission to submit nominations. This may indicate the Public role needs to be granted POST permission for nominations in Strapi admin panel.');
                }
                if (response.status === 500) {
                    throw new Error('Server error. Please try again later or contact support.');
                }
                throw new Error(errorData.error?.message || errorData.message || `Server error (${response.status})`);
            }

            // Show success message
            this.showSuccessMessage(form, {
                title: 'Nomination Submitted!',
                message: 'Thank you for your nomination. Our editorial team will review it and contact you if we need additional information.',
                icon: 'person_add'
            });

            // Reset form
            form.reset();

        } catch (error) {
            console.error('Nomination submission error:', error);

            // Show user-friendly error message
            let errorMessage = error.message || 'Failed to submit nomination. Please try again.';

            // Check for network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            }

            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast(errorMessage, 'error');
            } else {
                // Fallback to alert if UI is not available
                alert('Error: ' + errorMessage);
            }

            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Handle story form submission
     * Submits to /api/contributions with type: 'story'
     * Handles media upload (images + videos)
     * @param {HTMLFormElement} form
     */
    async handleStorySubmit(form) {
        console.log('[StoryForm] handleStorySubmit called');
        console.log('[StoryForm] form element:', form);

        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        // Validate story length
        const story = form.querySelector('#story').value;
        if (story.split(/\s+/).length < 50) {
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Please write at least 50 words for your story.', 'warning');
            }
            form.querySelector('#story').focus();
            return;
        }

        // Check permission checkbox
        const permission = form.querySelector('[name="permission"]');
        if (!permission.checked) {
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Please confirm the permission checkbox to submit your story.', 'warning');
            }
            permission.focus();
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin">refresh</span>
            Submitting...
        `;

        try {
            // Validate CONFIG first - fail fast before any API calls
            console.log('[StoryForm] Starting submission...');
            console.log('[StoryForm] CONFIG available:', typeof CONFIG !== 'undefined');
            console.log('[StoryForm] CONFIG.API_BASE_URL:', CONFIG?.API_BASE_URL);

            if (typeof CONFIG === 'undefined' || !CONFIG.API_BASE_URL) {
                const errorMsg = 'Configuration not loaded. Please refresh the page and try again.';
                console.error('[StoryForm]', errorMsg);
                if (typeof UI !== 'undefined' && UI.showToast) {
                    UI.showToast(errorMsg, 'error');
                } else {
                    alert('Error: ' + errorMsg);
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            // Ensure global API object exists for compatibility
            if (typeof API === 'undefined') {
                console.warn('[StoryForm] API object not found, using fetch() directly');
            }

            const token = (typeof Auth !== 'undefined' && Auth.isAuthenticated()) ? Auth.getAccessToken() : null;
            console.log('[StoryForm] Auth available:', typeof Auth !== 'undefined');
            console.log('[StoryForm] Token available:', !!token);

            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Upload media files first (if any)
            let mediaFileIds = [];
            const mediaInput = form.querySelector('#mediaUpload');
            if (mediaInput && mediaInput.files && mediaInput.files.length > 0) {
                submitBtn.innerHTML = `
                    <span class="material-symbols-outlined animate-spin">refresh</span>
                    Uploading media...
                `;
                try {
                    mediaFileIds = await this.uploadMediaFiles(mediaInput.files, token);
                    if (mediaFileIds.length === 0 && mediaInput.files.length > 0) {
                        console.warn('[StoryForm] Media upload skipped - files may be too large or upload endpoint requires auth');
                    }
                } catch (uploadError) {
                    console.warn('[StoryForm] Media upload failed, continuing without attachments:', uploadError);
                    // Continue without media - the story can still be submitted
                }
            }

            // Collect form data — map to Strapi contribution schema
            const storyType = form.querySelector('[name="storyType"]:checked');
            const subjectName = form.querySelector('#subjectName')?.value || '';
            const formData = {
                title: subjectName ? `Story: ${subjectName}` : 'Untitled Story',
                type: 'story',
                content: story,
                storyType: storyType ? storyType.value : 'other',
                subjectName: subjectName,
                relationship: form.querySelector('#relationship')?.value || '',
                region: form.querySelector('#storyRegion')?.value || '',
                theme: form.querySelector('#theme')?.value || '',
                lessons: form.querySelector('#lessons')?.value || '',
                contactName: form.querySelector('#contactName')?.value || '',
                contactEmail: form.querySelector('#contactEmail')?.value || '',
                permissionGranted: true,
                status: 'draft'
            };

            // Attach media file IDs if any were uploaded
            if (mediaFileIds.length > 0) {
                formData.media = mediaFileIds;
            }

            let successMessage = 'Thank you for sharing this story. Our editorial team will review it and may reach out for additional details or verification.';
            if (mediaFileIds.length === 0 && mediaInput && mediaInput.files && mediaInput.files.length > 0) {
                successMessage += ' Note: Media upload failed, but your story text was submitted successfully.';
            }

            console.log('[StoryForm] Submitting to:', `${CONFIG.API_BASE_URL}/api/contributions`);
            console.log('[StoryForm] Form data:', JSON.stringify({ data: formData }));

            submitBtn.innerHTML = `
                <span class="material-symbols-outlined animate-spin">refresh</span>
                Saving story...
            `;

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/contributions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ data: formData })
            });

            console.log('[StoryForm] Response status:', response.status);
            console.log('[StoryForm] Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('[StoryForm] Error data:', errorData);
                // Provide more helpful error messages for common issues
                if (response.status === 404) {
                    throw new Error('Unable to submit story. The server endpoint /api/contributions was not found. This may indicate the CMS needs to be rebuilt or the content type needs to be created.');
                }
                if (response.status === 401) {
                    throw new Error('Please sign in to submit your story.');
                }
                if (response.status === 403) {
                    throw new Error('You do not have permission to submit stories. This may indicate the Public role needs to be granted POST permission for contributions in Strapi admin panel.');
                }
                if (response.status === 500) {
                    throw new Error('Server error. Please try again later or contact support.');
                }
                throw new Error(errorData.error?.message || errorData.message || `Server error (${response.status})`);
            }

            // Show success message
            this.showSuccessMessage(form, {
                title: 'Story Submitted!',
                message: successMessage,
                icon: 'auto_stories'
            });

            // Reset form
            form.reset();
            // Clear file name display
            const fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) fileDisplay.textContent = '';

        } catch (error) {
            console.error('[StoryForm] Submission error:', error);

            // Show user-friendly error message
            let errorMessage = error.message || 'Failed to submit story. Please try again.';

            // Check for network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            }

            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast(errorMessage, 'error');
            } else {
                // Fallback to alert if UI is not available
                alert('Error: ' + errorMessage);
            }

            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Validate form fields
     * @param {HTMLFormElement} form
     * @returns {boolean}
     */
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            // Remove previous error styling
            field.classList.remove('border-red-500');

            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            }

            // Email validation
            if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    field.classList.add('border-red-500');
                    isValid = false;
                }
            }
        });

        if (!isValid) {
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Please fill in all required fields.', 'warning');
            }

            // Focus first invalid field
            const firstInvalid = form.querySelector('.border-red-500');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        return isValid;
    },

    /**
     * Show success message after form submission
     * @param {HTMLFormElement} form
     * @param {Object} options
     */
    showSuccessMessage(form, options) {
        const formContainer = form.closest('.bg-white');
        if (!formContainer) return;

        const { title, message, icon } = options;

        formContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="size-20 rounded-full bg-accent-teal/20 flex items-center justify-center mx-auto mb-6">
                    <span class="material-symbols-outlined text-accent-teal text-4xl">${icon}</span>
                </div>
                <h2 class="font-serif text-2xl font-bold text-text-main mb-4">${title}</h2>
                <p class="text-text-secondary max-w-md mx-auto mb-8">${message}</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="browse.html" class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">library_books</span>
                        Browse Encyclopedia
                    </a>
                    <button onclick="window.location.reload()" class="px-6 py-3 border border-border-light rounded-lg font-bold hover:bg-background-cream transition-colors inline-flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        Submit Another
                    </button>
                </div>
            </div>
        `;
    }
};

// Initialize form handlers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Forms] DOMContentLoaded fired');
    try {
        if (typeof FormHandler !== 'undefined') {
            FormHandler.init();
        }
    } catch (e) {
        console.error('[Forms] Error initializing:', e);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}

