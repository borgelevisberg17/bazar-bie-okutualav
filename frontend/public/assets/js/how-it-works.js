
        // Vanilla JS for interactivity: Menu toggle (basic, expandable)
        const menuToggle = document.querySelector('.menu-toggle');
        const menuExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            // In a full app, toggle menu visibility here
            console.log('Menu toggled'); // Placeholder for menu logic
        });

        // Smooth animations on scroll for steps (non-trivial: Intersection Observer)
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running'; // Trigger animation on view
                }
            });
        }, observerOptions);

        // Observe step contents
        document.querySelectorAll('.step-content').forEach(el => {
            el.style.animationPlayState = 'paused'; // Initial pause
            stepObserver.observe(el);
        });

        // Keyboard navigation for sellers (accessibility)
        const sellers = document.querySelectorAll('.seller-card');
        sellers.forEach((seller, index) => {
            seller.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Simulate click or focus next
                    if (index < sellers.length - 1) {
                        sellers[index + 1].focus();
                    }
                }
            });
        });

        // Horizontal scroll snap enhancement (smooth momentum)
        const sellersContainer = document.getElementById('sellersContainer');
        sellersContainer.addEventListener('scroll', () => {
            // Snap to nearest card
            const scrollLeft = sellersContainer.scrollLeft;
            const cardWidth = 220; // Approx card + gap
            const snapIndex = Math.round(scrollLeft / cardWidth);
            sellersContainer.scrollTo({
                left: snapIndex * cardWidth,
                behavior: 'smooth'
            });
        });
  