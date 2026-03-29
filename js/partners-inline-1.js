function filterPartners(tier) {
            // Update button styles
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.filter === tier) {
                    btn.classList.add('bg-primary', 'text-white');
                    btn.classList.remove('bg-background-cream');
                } else {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-background-cream');
                }
            });

            // Show/hide partner sections
            document.querySelectorAll('.partner-card').forEach(card => {
                if (tier === 'all' || card.dataset.tier === tier) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }