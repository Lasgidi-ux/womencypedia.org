(function () {
            const token = localStorage.getItem('womencypedia_access_token');
            if (token && document.body) {
                document.body.classList.add('authenticated');
            }
        })();