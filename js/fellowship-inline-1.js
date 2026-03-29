function filterFellowships(type) {
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

            // Filter fellowships
            document.querySelectorAll('.fellowship-card').forEach(card => {
                if (type === 'all') {
                    card.style.display = 'block';
                } else if (type === 'open') {
                    if (card.dataset.status === 'open') {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                } else {
                    if (card.dataset.type === type) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }