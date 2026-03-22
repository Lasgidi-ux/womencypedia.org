function toggleUnit(button) {
            const content = button.nextElementSibling;
            const icon = button.querySelector('.material-symbols-outlined');

            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.textContent = 'expand_less';
            } else {
                content.classList.add('hidden');
                icon.textContent = 'expand_more';
            }
        }