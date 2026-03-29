// ==================== SHARE STORY FORM LOGIC ====================
        // Always use production Strapi URL — never rely on CONFIG which may be localhost
        const STRAPI_URL = 'https://womencypedia-cms.onrender.com';

        // Mark form as handled so forms.js won't add a second submit handler
        window.__storyFormHandledByPage = true;

        // ==================== MEDIA UPLOAD SYSTEM ====================
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const MAX_FILES = 5;
        let selectedFiles = [];

        const ALLOWED_TYPES = {
            'image/jpeg': { icon: 'image', label: 'Image' },
            'image/png': { icon: 'image', label: 'Image' },
            'image/gif': { icon: 'gif_box', label: 'GIF' },
            'image/webp': { icon: 'image', label: 'Image' },
            'image/svg+xml': { icon: 'image', label: 'SVG' },
            'video/mp4': { icon: 'videocam', label: 'Video' },
            'video/webm': { icon: 'videocam', label: 'Video' },
            'video/quicktime': { icon: 'videocam', label: 'Video' },
            'video/x-msvideo': { icon: 'videocam', label: 'Video' },
            'audio/mpeg': { icon: 'audio_file', label: 'Audio' },
            'audio/wav': { icon: 'audio_file', label: 'Audio' },
            'audio/ogg': { icon: 'audio_file', label: 'Audio' },
            'audio/mp4': { icon: 'audio_file', label: 'Audio' },
            'audio/webm': { icon: 'audio_file', label: 'Audio' },
            'application/pdf': { icon: 'picture_as_pdf', label: 'PDF' },
            'application/msword': { icon: 'description', label: 'Document' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'description', label: 'Document' },
            'text/plain': { icon: 'article', label: 'Text' }
        };

        // Track blob URLs for cleanup to prevent memory leaks
        let activeBlobUrls = [];

        // Escape HTML to prevent XSS from user-controlled filenames
        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        // Revoke all tracked blob URLs
        function revokeAllBlobUrls() {
            activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
            activeBlobUrls = [];
        }

        function renderFilePreviews() {
            const list = document.getElementById('filePreviewList');
            if (!list) return;

            // Revoke previous blob URLs before re-rendering
            revokeAllBlobUrls();

            if (selectedFiles.length === 0) {
                list.classList.add('hidden');
                list.innerHTML = '';
                return;
            }

            list.classList.remove('hidden');
            list.innerHTML = selectedFiles.map((file, idx) => {
                const typeInfo = ALLOWED_TYPES[file.type] || { icon: 'insert_drive_file', label: 'File' };
                const isImage = file.type.startsWith('image/');
                const safeName = escapeHtml(file.name);
                let thumbHtml;
                if (isImage) {
                    const blobUrl = URL.createObjectURL(file);
                    activeBlobUrls.push(blobUrl);
                    thumbHtml = `<img src="${blobUrl}" alt="${safeName}" class="w-10 h-10 rounded object-cover" />`;
                } else {
                    thumbHtml = `<span class="material-symbols-outlined text-primary text-2xl">${typeInfo.icon}</span>`;
                }

                return `
                    <div class="flex items-center justify-between p-3 bg-white border border-border-light rounded-lg">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="flex-shrink-0 w-10 h-10 rounded bg-primary/5 flex items-center justify-center overflow-hidden">
                                ${thumbHtml}
                            </div>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-text-main truncate">${safeName}</p>
                                <p class="text-xs text-text-secondary">${typeInfo.label} • ${formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        <button type="button" onclick="removeFile(${idx})"
                            class="flex-shrink-0 size-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-text-secondary hover:text-red-500"
                            aria-label="Remove ${safeName}">
                            <span class="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                `;
            }).join('');
        }

        // Cleanup blob URLs on page unload
        window.addEventListener('beforeunload', revokeAllBlobUrls);

        function addFiles(newFiles) {
            for (const file of newFiles) {
                if (selectedFiles.length >= MAX_FILES) {
                    showToast(`Maximum ${MAX_FILES} files allowed.`, 'error');
                    break;
                }
                if (!ALLOWED_TYPES[file.type]) {
                    showToast(`"${file.name}" — unsupported file type.`, 'error');
                    continue;
                }
                if (file.size > MAX_FILE_SIZE) {
                    showToast(`"${file.name}" exceeds 10MB limit.`, 'error');
                    continue;
                }
                // Prevent duplicates
                if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) continue;
                selectedFiles.push(file);
            }
            renderFilePreviews();
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            renderFilePreviews();
        }

        // File input handler
        const mediaInput = document.getElementById('mediaUpload');
        if (mediaInput) {
            mediaInput.addEventListener('change', function () {
                addFiles(Array.from(this.files));
                this.value = ''; // clear so same file can be re-selected
            });
        }

        // Drag & Drop
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            ['dragenter', 'dragover'].forEach(evt => {
                dropZone.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.add('border-primary', 'bg-primary/5');
                });
            });
            ['dragleave', 'drop'].forEach(evt => {
                dropZone.addEventListener(evt, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.classList.remove('border-primary', 'bg-primary/5');
                });
            });
            dropZone.addEventListener('drop', function (e) {
                if (e.dataTransfer && e.dataTransfer.files) {
                    addFiles(Array.from(e.dataTransfer.files));
                }
            });
        }

        // Upload files to Strapi media library
        async function uploadMediaToStrapi(files, token) {
            const uploadedIds = [];
            for (const file of files) {
                const fd = new FormData();
                fd.append('files', file);
                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                try {
                    const res = await fetch(`${STRAPI_URL}/api/upload`, {
                        method: 'POST',
                        headers,
                        body: fd
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) uploadedIds.push(data[0].id);
                    } else {
                        console.warn(`[MediaUpload] Failed to upload "${file.name}": ${res.status}`);
                    }
                } catch (err) {
                    console.warn(`[MediaUpload] Error uploading "${file.name}":`, err);
                }
            }
            return uploadedIds;
        }

        // ==================== WORD COUNTER ====================
        const storyTextarea = document.getElementById('story');
        const wordCounter = document.getElementById('wordCounter');

        if (storyTextarea && wordCounter) {
            storyTextarea.addEventListener('input', function () {
                const words = this.value.trim().split(/\s+/).filter(w => w.length > 0).length;
                wordCounter.textContent = `${words} word${words !== 1 ? 's' : ''}`;

                if (words >= 500) {
                    wordCounter.className = 'word-counter good';
                    wordCounter.textContent += ' ✓ Great length!';
                } else if (words >= 200) {
                    wordCounter.className = 'word-counter warning';
                    wordCounter.textContent += ` — ${500 - words} more recommended`;
                } else {
                    wordCounter.className = 'word-counter';
                }
            });
        }

        // ==================== TOAST NOTIFICATION ====================
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            setTimeout(() => { toast.classList.remove('show'); }, 5000);
        }

        // ==================== FORM SUBMISSION ====================
        const storyForm = document.getElementById('story-form');

        if (storyForm) {
            storyForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                e.stopImmediatePropagation(); // prevent forms.js from also handling this

                const submitBtn = document.getElementById('submitBtn');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[22px] animate-spin">progress_activity</span> Submitting...';

                try {
                    // Collect form data
                    const formData = {
                        storyType: document.querySelector('input[name="storyType"]:checked')?.value || 'myself',
                        subjectName: document.getElementById('subjectName').value.trim(),
                        relationship: document.getElementById('relationship').value.trim(),
                        storyRegion: document.getElementById('storyRegion').value.trim(),
                        theme: document.getElementById('theme').value,
                        story: document.getElementById('story').value.trim(),
                        lessons: document.getElementById('lessons').value.trim(),
                        contactName: document.getElementById('contactName').value.trim(),
                        contactEmail: document.getElementById('contactEmail').value.trim(),
                        permissionGranted: document.querySelector('input[name="permission"]').checked
                    };

                    // Validate required fields
                    if (!formData.subjectName || !formData.storyRegion || !formData.theme || !formData.story || !formData.contactName || !formData.contactEmail) {
                        throw new Error('Please fill in all required fields.');
                    }

                    if (!formData.permissionGranted) {
                        throw new Error('Please confirm the permission checkbox before submitting.');
                    }

                    // Upload media files first (if any)
                    let mediaFileIds = [];
                    if (selectedFiles.length > 0) {
                        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[22px] animate-spin">progress_activity</span> Uploading media...';
                        const token = localStorage.getItem('womencypedia_access_token');
                        try {
                            mediaFileIds = await uploadMediaToStrapi(selectedFiles, token);
                            console.log('[ShareStory] Uploaded media IDs:', mediaFileIds);
                        } catch (uploadErr) {
                            console.warn('[ShareStory] Media upload failed, continuing without:', uploadErr);
                        }
                        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[22px] animate-spin">progress_activity</span> Saving story...';
                    }

                    // Build Strapi payload
                    const payload = {
                        data: {
                            title: formData.subjectName ? `Story: ${formData.subjectName}` : 'Untitled Story',
                            type: 'story',
                            content: formData.story,
                            storyType: formData.storyType,
                            subjectName: formData.subjectName,
                            relationship: formData.relationship,
                            region: formData.storyRegion,
                            theme: formData.theme,
                            lessons: formData.lessons,
                            contactName: formData.contactName,
                            contactEmail: formData.contactEmail,
                            permissionGranted: formData.permissionGranted,
                            status: 'draft'
                        }
                    };

                    // Attach media if uploaded
                    if (mediaFileIds.length > 0) {
                        payload.data.media = mediaFileIds;
                    }

                    // Always use STRAPI_URL — never CONFIG.API_BASE_URL (may be localhost)
                    console.log('[ShareStory] Submitting to:', `${STRAPI_URL}/api/contributions`);
                    const token = localStorage.getItem('womencypedia_access_token');

                    const response = await fetch(`${STRAPI_URL}/api/contributions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { Authorization: `Bearer ${token}` })
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        const msg = errData?.error?.message || errData?.message || `Server error: ${response.status}`;
                        throw new Error(msg);
                    }

                    const result = await response.json();
                    console.log('✅ Story submitted successfully:', result);

                    // Build success message
                    let successMsg = '✅ Your story has been submitted successfully! Thank you.';
                    if (selectedFiles.length > 0 && mediaFileIds.length === 0) {
                        successMsg += ' (Media upload was skipped — your story text was saved.)';
                    } else if (mediaFileIds.length > 0) {
                        successMsg += ` (${mediaFileIds.length} file${mediaFileIds.length > 1 ? 's' : ''} attached.)`;
                    }
                    showToast(successMsg, 'success');

                    storyForm.reset();

                    // Re-check the default radio
                    const defaultRadio = document.querySelector('input[name="storyType"][value="myself"]');
                    if (defaultRadio) defaultRadio.checked = true;

                    // Reset word counter
                    if (wordCounter) {
                        wordCounter.textContent = '0 words';
                        wordCounter.className = 'word-counter';
                    }

                    // Reset file list
                    selectedFiles = [];
                    renderFilePreviews();

                } catch (error) {
                    console.error('❌ Story submission failed:', error);
                    showToast('❌ ' + (error.message || 'Failed to submit story. Please try again.'), 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHTML;
                }
            });
        }

        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function (reg) {
                console.log('SW registered:', reg.scope);
            }).catch(function () { /* SW not available */ });
        }