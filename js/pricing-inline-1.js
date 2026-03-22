let isAnnual = false;
        function toggleBilling() {
            isAnnual = !isAnnual;
            const toggle = document.getElementById('toggle-dot');
            const btn = document.getElementById('billing-toggle');
            const labelM = document.getElementById('label-monthly');
            const labelA = document.getElementById('label-annual');
            toggle.style.transform = isAnnual ? 'translateX(28px)' : 'translateX(0)';
            btn.style.backgroundColor = isAnnual ? '#2F8F86' : '';
            labelM.className = isAnnual ? 'text-sm font-medium text-text-secondary' : 'text-sm font-semibold text-text-main';
            labelA.className = isAnnual ? 'text-sm font-semibold text-text-main' : 'text-sm font-medium text-text-secondary';
            document.querySelectorAll('[data-monthly]').forEach(el => {
                el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
            });
        }

        // Global search
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('input[type="search"]').forEach(input => {
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const q = this.value.trim();
                        if (q) window.location.href = 'browse.html?search=' + encodeURIComponent(q);
                    }
                });
            });
        });