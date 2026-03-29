function filterReports(type) {
            // Update button styles
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.filter === type) {
                    btn.classList.add('bg-primary', 'text-white');
                    btn.classList.remove('bg-background-cream');
                } else {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-background-cream');
                }
            });

            // Filter reports
            document.querySelectorAll('.report-card').forEach(card => {
                if (type === 'all' || card.dataset.type === type) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }