// Toggle FAQ item
        function toggleFaq(button) {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('.faq-icon');

            // Close all other open items
            document.querySelectorAll('.faq-answer.open').forEach(item => {
                if (item !== answer) {
                    item.classList.remove('open');
                    item.previousElementSibling.querySelector('.faq-icon').classList.remove('open');
                }
            });

            // Toggle current item
            answer.classList.toggle('open');
            icon.classList.toggle('open');
        }

        // FAQ search
        document.getElementById('faq-search').addEventListener('input', function () {
            const query = this.value.toLowerCase();
            document.querySelectorAll('.faq-item').forEach(item => {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer div').textContent.toLowerCase();
                if (question.includes(query) || answer.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = query ? 'none' : '';
                }
            });
        });