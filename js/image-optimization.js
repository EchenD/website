// Image optimization and lazy loading implementation
document.addEventListener('DOMContentLoaded', () => {
    // Check WebP support
    const checkWebP = (callback) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
            callback(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };

    // Initialize lazy loading
    const initLazyLoading = () => {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    };

    // Load image with blur-up technique
    const loadImage = (img) => {
        const src = img.getAttribute('data-src');
        const webpSrc = img.getAttribute('data-src-webp');

        // Create a new image to preload
        const tempImage = new Image();

        tempImage.onload = () => {
            // Remove blur effect
            img.classList.remove('blur-up');

            // Set the final image
            if (webpSrc && window.supportsWebP) {
                img.src = webpSrc;
            } else {
                img.src = src;
            }
        };

        // Start loading the image
        tempImage.src = webpSrc && window.supportsWebP ? webpSrc : src;
    };

    // Check WebP support and initialize
    checkWebP((supportsWebP) => {
        window.supportsWebP = supportsWebP;
        initLazyLoading();
    });
}); 
