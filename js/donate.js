/**
 * Womencypedia — Donate Page Logic
 * Supports one-time and monthly donations via Paystack or Flutterwave.
 * Falls back to a custom checkout modal if no gateway is configured.
 */

const Donate = (() => {
    // ─── Configuration ─────────────────────────────────────
    const PAYSTACK_PUBLIC_KEY = typeof CONFIG !== 'undefined' && CONFIG.PAYSTACK_PUBLIC_KEY
        ? CONFIG.PAYSTACK_PUBLIC_KEY
        : '';

    const FLUTTERWAVE_PUBLIC_KEY = typeof CONFIG !== 'undefined' && CONFIG.FLUTTERWAVE_PUBLIC_KEY
        ? CONFIG.FLUTTERWAVE_PUBLIC_KEY
        : '';

    let selectedAmount = null;
    let selectedType = 'one-time'; // 'one-time' | 'monthly' | 'legacy'

    // ─── State ─────────────────────────────────────────────
    const state = {
        donorName: '',
        donorEmail: '',
        amount: 0,
        currency: 'USD',
        type: 'one-time',
        isAnonymous: false,
        message: ''
    };

    // ─── Init ──────────────────────────────────────────────
    function init() {
        // Bind amount buttons
        document.querySelectorAll('[data-amount]').forEach(btn => {
            btn.addEventListener('click', function () {
                const section = this.closest('[data-donation-type]');
                if (section) {
                    selectedType = section.dataset.donationType;
                }
                selectAmount(this.dataset.amount, this);
            });
        });

        // Bind custom amount inputs
        document.querySelectorAll('[data-custom-amount]').forEach(input => {
            input.addEventListener('input', function () {
                const section = this.closest('[data-donation-type]');
                if (section) {
                    selectedType = section.dataset.donationType;
                }
                // Deselect preset buttons in this section
                const buttons = this.closest('.grid, .space-y-2')?.parentElement?.querySelectorAll('[data-amount]');
                if (buttons) {
                    buttons.forEach(b => b.classList.remove('border-accent-gold', 'bg-accent-gold/10'));
                }
                const value = parseFloat(this.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(value) && value > 0) {
                    selectedAmount = value;
                }
            });
        });

        // Bind donate/action buttons
        document.querySelectorAll('[data-donate-action]').forEach(btn => {
            btn.addEventListener('click', function () {
                const section = this.closest('[data-donation-type]');
                if (section) {
                    selectedType = section.dataset.donationType;
                }

                if (selectedType === 'legacy') {
                    openLegacyModal();
                    return;
                }

                if (!selectedAmount || selectedAmount <= 0) {
                    showToast('Please select or enter an amount', 'warning');
                    return;
                }

                openCheckoutModal();
            });
        });

        
    }

    // ─── Select Amount ─────────────────────────────────────
    function selectAmount(amount, element) {
        const section = element.closest('[data-donation-type]');
        if (section) {
            section.querySelectorAll('[data-amount]').forEach(btn => {
                btn.classList.remove('border-accent-gold', 'bg-accent-gold/10', 'ring-2', 'ring-accent-gold/50');
                btn.classList.add('border-border-light');
            });
        }

        element.classList.remove('border-border-light');
        element.classList.add('border-accent-gold', 'bg-accent-gold/10', 'ring-2', 'ring-accent-gold/50');

        selectedAmount = parseFloat(amount);

        // Clear custom input in same section
        const customInput = section?.querySelector('[data-custom-amount]');
        if (customInput) customInput.value = '';
    }

    // ─── Checkout Modal ────────────────────────────────────
    function openCheckoutModal() {
        const isMonthly = selectedType === 'monthly';
        const typeLabel = isMonthly ? 'Monthly Donation' : 'One-Time Donation';
        const amountLabel = isMonthly ? `$${selectedAmount}/month` : `$${selectedAmount}`;

        // Check if user is logged in and pre-fill
        const savedUser = localStorage.getItem('womencypedia_user');
        let prefillName = '';
        let prefillEmail = '';
        if (savedUser) {
            try {
                const u = JSON.parse(savedUser);
                prefillName = u.username || u.name || '';
                prefillEmail = u.email || '';
            } catch (e) { }
        }

        const modal = document.createElement('div');
        modal.id = 'donate-checkout-modal';
        modal.className = 'fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full p-8 relative animate-in" style="animation: fadeInUp 0.3s ease">
                <button onclick="Donate.closeCheckout()" class="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors">
                    <span class="material-symbols-outlined text-text-secondary">close</span>
                </button>

                <div class="text-center mb-6">
                    <div class="size-16 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-accent-gold text-3xl">${isMonthly ? 'autorenew' : 'favorite'}</span>
                    </div>
                    <h2 class="font-serif text-2xl font-bold text-text-main">${typeLabel}</h2>
                    <p class="text-accent-gold text-2xl font-bold mt-2">${amountLabel}</p>
                </div>

                <form id="donate-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Full Name</label>
                        <input type="text" id="donor-name" required value="${prefillName}"
                            placeholder="Your full name"
                            class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Email Address</label>
                        <input type="email" id="donor-email" required value="${prefillEmail}"
                            placeholder="you@example.com"
                            class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm">
                    </div>

                    <div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="donor-anonymous" class="size-4 rounded border-border-light text-accent-gold focus:ring-accent-gold">
                            <span class="text-sm text-text-secondary">Make my donation anonymous</span>
                        </label>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Message (Optional)</label>
                        <textarea id="donor-message" rows="2" placeholder="Add a message of support..."
                            class="w-full px-4 py-3 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm resize-none"></textarea>
                    </div>

                    <button type="submit"
                        class="w-full h-14 bg-accent-gold text-white font-bold rounded-lg hover:bg-accent-gold/90 transition-colors flex items-center justify-center gap-2 text-base">
                        <span class="material-symbols-outlined text-[20px]">lock</span>
                        Donate ${amountLabel} Securely
                    </button>

                    <p class="text-xs text-text-secondary text-center mt-3">
                        <span class="material-symbols-outlined text-[14px] align-middle">verified_user</span>
                        Secure payment processed via Paystack. Your data is encrypted.
                    </p>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) Donate.closeCheckout();
        });

        // Handle form submission
        document.getElementById('donate-form').addEventListener('submit', function (e) {
            e.preventDefault();
            processDonation();
        });
    }

    // ─── Process Donation ──────────────────────────────────
    function processDonation() {
        const name = document.getElementById('donor-name').value.trim();
        const email = document.getElementById('donor-email').value.trim();
        const anonymous = document.getElementById('donor-anonymous').checked;
        const message = document.getElementById('donor-message').value.trim();

        if (!name || !email) {
            showToast('Please fill in your name and email', 'warning');
            return;
        }

        state.donorName = name;
        state.donorEmail = email;
        state.amount = selectedAmount;
        state.type = selectedType;
        state.isAnonymous = anonymous;
        state.message = message;

        // Try Paystack first
        if (PAYSTACK_PUBLIC_KEY && typeof PaystackPop !== 'undefined') {
            processWithPaystack();
            return;
        }

        // Try Flutterwave
        if (FLUTTERWAVE_PUBLIC_KEY && typeof FlutterwaveCheckout !== 'undefined') {
            processWithFlutterwave();
            return;
        }

        // Fallback: record donation intent in Strapi and show thank you
        recordDonationIntent();
    }

    // ─── Paystack ──────────────────────────────────────────
    function processWithPaystack() {
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: state.donorEmail,
            amount: state.amount * 100, // In kobo/cents
            currency: state.currency,
            ref: 'WC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            metadata: {
                custom_fields: [
                    { display_name: "Donor Name", variable_name: "donor_name", value: state.donorName },
                    { display_name: "Donation Type", variable_name: "donation_type", value: state.type },
                    { display_name: "Anonymous", variable_name: "anonymous", value: state.isAnonymous },
                    { display_name: "Message", variable_name: "message", value: state.message }
                ]
            },
            plan: state.type === 'monthly' ? CONFIG.PAYSTACK_MONTHLY_PLAN : undefined,
            callback: function (response) {
                showThankYou(response.reference);
            },
            onClose: function () {
                showToast('Payment window closed', 'info');
            }
        });
        handler.openIframe();
    }

    // ─── Flutterwave ───────────────────────────────────────
    function processWithFlutterwave() {
        FlutterwaveCheckout({
            public_key: FLUTTERWAVE_PUBLIC_KEY,
            tx_ref: 'WC-' + Date.now(),
            amount: state.amount,
            currency: state.currency,
            payment_options: 'card,mobilemoney,ussd',
            customer: {
                email: state.donorEmail,
                name: state.donorName,
            },
            customizations: {
                title: 'Womencypedia Donation',
                description: `${state.type === 'monthly' ? 'Monthly' : 'One-time'} donation of $${state.amount}`,
                logo: 'https://womencypedia.org/images/womencypedia-logo.png',
            },
            callback: function (data) {
                showThankYou(data.transaction_id);
            },
            onclose: function () { }
        });
    }

    // ─── Fallback: Record Intent ───────────────────────────
    async function recordDonationIntent() {
        try {
            // If Strapi is available, save the donation intent
            if (typeof StrapiAPI !== 'undefined') {
                const token = localStorage.getItem('womencypedia_access_token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                await fetch(`${CONFIG.API_BASE_URL}/api/donations`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        data: {
                            donorName: state.isAnonymous ? 'Anonymous' : state.donorName,
                            donorEmail: state.donorEmail,
                            amount: state.amount,
                            currency: state.currency,
                            type: state.type,
                            status: 'pending',
                            message: state.message
                        }
                    })
                });
            }
        } catch (err) {
            
        }

        // Show thank you page regardless
        showThankYou('PENDING-' + Date.now());
    }

    // ─── Thank You Screen ──────────────────────────────────
    function showThankYou(reference) {
        closeCheckout();

        const thankYou = document.createElement('div');
        thankYou.id = 'donate-thankyou-modal';
        thankYou.className = 'fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4';
        thankYou.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full p-10 text-center relative">
                <div class="size-20 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-6">
                    <span class="material-symbols-outlined text-accent-gold text-5xl">celebration</span>
                </div>
                <h2 class="font-serif text-3xl font-bold text-text-main mb-4">Thank You!</h2>
                <p class="text-text-secondary text-lg mb-2">Your generous ${state.type === 'monthly' ? 'monthly' : ''} donation of <strong class="text-accent-gold">$${state.amount}</strong> helps preserve women's stories.</p>
                <p class="text-text-secondary text-sm mb-6">A confirmation email has been sent to <strong>${state.donorEmail}</strong></p>

                ${reference ? `<p class="text-xs text-text-secondary/60 mb-6">Reference: ${reference}</p>` : ''}

                <div class="space-y-3">
                    <a href="index.html"
                        class="block w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">home</span>
                        Return Home
                    </a>
                    <button onclick="document.getElementById('donate-thankyou-modal').remove()"
                        class="block w-full h-12 border border-border-light text-text-main font-bold rounded-lg hover:bg-lavender-soft transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(thankYou);
        thankYou.addEventListener('click', (e) => {
            if (e.target === thankYou) thankYou.remove();
        });
    }

    // ─── Legacy Circle Modal ───────────────────────────────
    function openLegacyModal() {
        const modal = document.createElement('div');
        modal.id = 'legacy-modal';
        modal.className = 'fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-lg w-full p-8 relative">
                <button onclick="document.getElementById('legacy-modal').remove()" class="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors">
                    <span class="material-symbols-outlined text-text-secondary">close</span>
                </button>

                <div class="text-center mb-6">
                    <div class="size-16 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-accent-gold text-3xl">workspace_premium</span>
                    </div>
                    <h2 class="font-serif text-2xl font-bold text-text-main">Join the Legacy Circle</h2>
                    <p class="text-text-secondary mt-2">Make a transformative gift of $1,000 or more and become part of our founding circle.</p>
                </div>

                <form id="legacy-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Full Name *</label>
                        <input type="text" required placeholder="Your full name"
                            class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Email *</label>
                        <input type="email" required placeholder="you@example.com"
                            class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Organization (Optional)</label>
                        <input type="text" placeholder="Your organization"
                            class="w-full h-12 px-4 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-text-main mb-2">Message</label>
                        <textarea rows="3" placeholder="Why do you want to support Womencypedia?"
                            class="w-full px-4 py-3 border border-border-light rounded-lg focus:border-accent-gold focus:ring-1 focus:ring-accent-gold text-sm resize-none"></textarea>
                    </div>
                    <button type="submit"
                        class="w-full h-14 bg-accent-gold text-white font-bold rounded-lg hover:bg-accent-gold/90 transition-colors flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[20px]">mail</span>
                        Request to Join
                    </button>
                    <p class="text-xs text-text-secondary text-center">Our team will contact you within 48 hours to discuss your gift.</p>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.getElementById('legacy-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const inputs = this.querySelectorAll('input, textarea');
            const name = inputs[0].value;
            const email = inputs[1].value;

            // Save to Strapi if available
            try {
                if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) {
                    await fetch(`${CONFIG.API_BASE_URL}/api/contact-submissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: {
                                name,
                                email,
                                subject: 'Legacy Circle Application',
                                message: inputs[3]?.value || '',
                                organization: inputs[2]?.value || ''
                            }
                        })
                    });
                }
            } catch (err) {
                
            }

            modal.remove();
            showToast('Thank you! Our team will contact you within 48 hours.', 'success');
        });
    }

    // ─── Close checkout ────────────────────────────────────
    function closeCheckout() {
        const modal = document.getElementById('donate-checkout-modal');
        if (modal) modal.remove();
    }

    // ─── Toast Helper ──────────────────────────────────────
    function showToast(message, type = 'info') {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, type);
        } else {
            alert(message);
        }
    }

    return {
        init,
        closeCheckout,
        selectAmount
    };
})();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => Donate.init());
