// Multi-step form functionality
        let currentStep = 1;
        const totalSteps = 4;

        function updateProgress() {
            // Update step indicators
            document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
                const stepNum = index + 1;
                const circle = indicator.querySelector('div');
                const label = indicator.querySelector('span');

                if (stepNum === currentStep) {
                    circle.classList.add('bg-primary', 'text-white');
                    circle.classList.remove('bg-border-light', 'text-text-secondary');
                    if (label) {
                        label.classList.add('text-primary');
                        label.classList.remove('text-text-secondary');
                    }
                } else if (stepNum < currentStep) {
                    circle.classList.add('bg-accent-teal', 'text-white');
                    circle.classList.remove('bg-border-light', 'text-text-secondary', 'bg-primary');
                    if (label) {
                        label.classList.add('text-accent-teal');
                        label.classList.remove('text-text-secondary', 'text-primary');
                    }
                } else {
                    circle.classList.add('bg-border-light', 'text-text-secondary');
                    circle.classList.remove('bg-primary', 'bg-accent-teal', 'text-white');
                    if (label) {
                        label.classList.add('text-text-secondary');
                        label.classList.remove('text-primary', 'text-accent-teal');
                    }
                }
            });

            // Update progress bars
            for (let i = 1; i < totalSteps; i++) {
                const progressBar = document.getElementById(`progress-${i}`);
                if (progressBar) {
                    if (i < currentStep) {
                        progressBar.style.width = '100%';
                    } else if (i === currentStep) {
                        progressBar.style.width = '50%';
                    } else {
                        progressBar.style.width = '0%';
                    }
                }
            }

            // Show/hide form steps
            document.querySelectorAll('.form-step').forEach((step, index) => {
                if (index + 1 === currentStep) {
                    step.classList.remove('hidden');
                } else {
                    step.classList.add('hidden');
                }
            });

            // Update buttons
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const submitBtn = document.getElementById('submit-btn');

            if (currentStep === 1) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }

            if (currentStep === totalSteps) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                updateSummary();
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            }
        }

        function nextStep() {
            // Validate current step
            const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            const requiredFields = currentFormStep.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500');
                } else {
                    field.classList.remove('border-red-500');
                }
            });

            if (!isValid) {
                alert('Please fill in all required fields.');
                return;
            }

            if (currentStep < totalSteps) {
                currentStep++;
                updateProgress();
            }
        }

        function prevStep() {
            if (currentStep > 1) {
                currentStep--;
                updateProgress();
            }
        }

        function updateSummary() {
            const summary = document.getElementById('application-summary');
            const form = document.getElementById('verification-form');
            const formData = new FormData(form);

            summary.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-text-secondary">Organization:</span>
                        <p class="font-medium text-text-main">${formData.get('organizationName') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-text-secondary">Country:</span>
                        <p class="font-medium text-text-main">${formData.get('country') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-text-secondary">Sector:</span>
                        <p class="font-medium text-text-main">${formData.get('sector') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-text-secondary">Type:</span>
                        <p class="font-medium text-text-main">${formData.get('organizationType') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-text-secondary">Applicant:</span>
                        <p class="font-medium text-text-main">${formData.get('applicantName') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-text-secondary">Email:</span>
                        <p class="font-medium text-text-main">${formData.get('applicantEmail') || 'N/A'}</p>
                    </div>
                </div>
            `;
        }

        // Form submission
        document.getElementById('verification-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);

            const submissionData = {
                applicantName: formData.get('applicantName'),
                applicantEmail: formData.get('applicantEmail'),
                applicantRole: formData.get('applicantRole'),
                organizationName: formData.get('organizationName'),
                organizationWebsite: formData.get('organizationWebsite'),
                country: formData.get('country'),
                sector: formData.get('sector'),
                organizationType: formData.get('organizationType'),
                foundingYear: formData.get('foundingYear'),
                leadershipDescription: formData.get('leadershipDescription'),
                missionStatement: formData.get('missionStatement'),
                impactMetrics: {
                    employees: formData.get('employees'),
                    womenInLeadership: formData.get('womenInLeadership'),
                    beneficiaries: formData.get('beneficiaries'),
                    annualBudget: formData.get('annualBudget'),
                    impactDescription: formData.get('impactDescription')
                },
                status: 'pending',
                submittedAt: new Date().toISOString()
            };

            try {
                // Try to submit to API
                if (typeof CONFIG !== 'undefined' && CONFIG.USE_STRAPI) {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/verification-applications`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: submissionData })
                    });

                    if (response.ok) {
                        showSuccess();
                        return;
                    }
                }

                // Fallback: Store locally and show success
                console.log('Application submitted:', submissionData);
                localStorage.setItem('verification_application', JSON.stringify(submissionData));
                showSuccess();

            } catch (error) {
                console.error('Submission error:', error);
                // Show success anyway for demo purposes
                showSuccess();
            }
        });

        function showSuccess() {
            document.getElementById('verification-form').classList.add('hidden');
            document.getElementById('success-message').classList.remove('hidden');
            document.getElementById('progress-steps').classList.add('hidden');
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            updateProgress();
        });