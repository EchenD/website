class WorkDetailsManager {
    constructor() {
        this.workData = null;
        this.currentImageIndex = 0;
        this.images = [];

        // DOM Elements
        this.elements = {
            title: document.getElementById('work-title'),
            date: document.getElementById('work-date'),
            category: document.getElementById('work-category'),
            role: document.getElementById('work-role'),
            description: document.getElementById('work-description'),
            gallery: document.getElementById('gallery-container'),
            processSteps: document.getElementById('process-steps'),
            toolsList: document.getElementById('tools-list'),
            linksList: document.getElementById('links-list'),
            prevButton: document.getElementById('prev-image'),
            nextButton: document.getElementById('next-image')
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.loadWorkData = this.loadWorkData.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.showImage = this.showImage.bind(this);
        this.prevImage = this.prevImage.bind(this);
        this.nextImage = this.nextImage.bind(this);

        // Add image loading optimization
        this.imageCache = new Map();
        this.isLoading = false;
    }

    async init() {
        try {
            // Get work ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const workId = urlParams.get('id');

            if (!workId) {
                throw new Error('No work ID provided');
            }

            // Load work data
            await this.loadWorkData(workId);

            // Update UI
            this.updateUI();

            // Setup event listeners
            this.setupEventListeners();

            // Show first image
            this.showImage(0);

        } catch (error) {
            console.error('Error initializing work details:', error);
            this.showError('Failed to load work details. Please try again later.');
        }
    }

    async loadWorkData(workId) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch(`data/works/${workId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.workData = await response.json();

            // Preload images
            await this.preloadImages();
        } catch (error) {
            console.error('Error loading work data:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async preloadImages() {
        if (!this.workData?.images) return;

        const imagePromises = this.workData.images.map(async (image) => {
            if (this.imageCache.has(image.src)) {
                return this.imageCache.get(image.src);
            }

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.imageCache.set(image.src, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = image.src;
            });
        });

        try {
            await Promise.all(imagePromises);
        } catch (error) {
            console.error('Error preloading images:', error);
        }
    }

    updateUI() {
        if (!this.workData) return;

        // Update header
        this.elements.title.textContent = this.workData.title;
        this.elements.date.textContent = this.workData.details.date;
        this.elements.category.textContent = this.workData.details.category;
        this.elements.role.textContent = this.workData.details.role;

        // Update description
        this.elements.description.textContent = this.workData.description;

        // Update gallery
        this.images = this.workData.images;
        this.elements.gallery.innerHTML = this.images.map((image, index) => `
            <img src="${image.src}" 
                 alt="${image.alt}" 
                 class="${index === 0 ? 'active' : ''}" 
                 data-caption="${image.caption}"
                 onerror="this.onerror=null; this.src='assets/images/placeholder.jpg'; this.classList.add('image-error');">
            <div class="image-placeholder">Image not available</div>
        `).join('');

        // Update process steps
        this.elements.processSteps.innerHTML = this.workData.process.map(step => `
            <div class="process-step">
                <h3>${step.title}</h3>
                <p>${step.description}</p>
                ${step.image ? `
                <div class="process-image-container">
                    <img src="${step.image}" 
                         alt="${step.title}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='assets/images/placeholder.jpg'; this.classList.add('image-error');">
                    <div class="image-placeholder">Process image not available</div>
                </div>
                ` : ''}
            </div>
        `).join('');

        // Update tools
        this.elements.toolsList.innerHTML = this.workData.details.tools.map(tool => `
            <span class="tool-tag">${tool}</span>
        `).join('');

        // Update links
        this.elements.linksList.innerHTML = this.workData.links.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="work-link">
                ${link.text}
            </a>
        `).join('');
    }

    setupEventListeners() {
        this.elements.prevButton.addEventListener('click', this.prevImage);
        this.elements.nextButton.addEventListener('click', this.nextImage);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevImage();
            if (e.key === 'ArrowRight') this.nextImage();
        });
    }

    showImage(index) {
        const images = this.elements.gallery.querySelectorAll('img');
        images.forEach(img => img.classList.remove('active'));
        images[index].classList.add('active');
        this.currentImageIndex = index;

        // Update navigation buttons
        this.elements.prevButton.style.display = index === 0 ? 'none' : 'block';
        this.elements.nextButton.style.display = index === images.length - 1 ? 'none' : 'block';
    }

    prevImage() {
        if (this.currentImageIndex > 0) {
            this.showImage(this.currentImageIndex - 1);
        }
    }

    nextImage() {
        if (this.currentImageIndex < this.images.length - 1) {
            this.showImage(this.currentImageIndex + 1);
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.work-details-container').prepend(errorDiv);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const workDetails = new WorkDetailsManager();
    workDetails.init();
}); 
