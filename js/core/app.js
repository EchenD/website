/**
 * Main Application Class
 * Version: 1.0.0
 * Author: Echen Deligani
 * Last Updated: 2025-03-17
 */

export class App {
    constructor() {
        this.services = new Map();
        this.state = {
            isInitialized: false,
            currentSection: 'landing',
            isLoading: false,
            error: null
        };
    }

    async init() {
        if (this.state.isInitialized) return;
        this.state.isLoading = true;

        try {
            // Initialize core services
            await this.initializeServices();

            // Setup navigation
            this.setupNavigation();

            // Initialize content
            await this.loadInitialContent();

            this.state.isInitialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Application initialization failed:', error);
            throw error;
        } finally {
            this.state.isLoading = false;
        }
    }

    async initializeServices() {
        try {
            // Initialize Unity service
            const unityLoader = window.unityLoader;
            if (!unityLoader) {
                throw new Error('Unity loader not found');
            }
            this.services.set('unity', unityLoader);

            // Initialize other services as needed
            // ... add other service initializations here
        } catch (error) {
            console.error('Service initialization failed:', error);
            throw error;
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('nav ul');

        // Handle navigation clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.navigateToSection(targetId);
            });
        });

        // Handle mobile menu toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('show');
            });
        }
    }

    async loadInitialContent() {
        try {
            // Load works data
            const response = await fetch('./data/works.json');
            if (!response.ok) throw new Error('Failed to load works data');
            const data = await response.json();

            // Populate works sections
            this.populateWorks('dev-works', data.development);
            this.populateWorks('art-works', data.art);
        } catch (error) {
            console.error('Content loading failed:', error);
            throw error;
        }
    }

    populateWorks(containerId, works) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = works.map(work => `
            <div class="work-item" data-id="${work.id}">
                <div class="work-image">
                    <img src="${work.thumbnail || './assets/images/placeholder.jpg'}" 
                         alt="${work.title}" 
                         class="lazy-image"
                         onerror="this.onerror=null; this.src='./assets/images/placeholder.jpg'; this.classList.add('image-error');">
                    <div class="image-placeholder">Image not available</div>
                </div>
                <div class="work-info">
                    <h4>${work.title}</h4>
                    <p>${work.description}</p>
                </div>
            </div>
        `).join('');

        // Initialize lazy loading for images
        this.initializeLazyLoading(container);
    }

    initializeLazyLoading(container) {
        const images = container.querySelectorAll('.lazy-image');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    navigateToSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.state.currentSection = sectionId;
        }
    }

    dispose() {
        // Cleanup services
        for (const [name, service] of this.services) {
            if (service && typeof service.dispose === 'function') {
                service.dispose();
            }
        }
        this.services.clear();

        // Reset state
        this.state = {
            isInitialized: false,
            currentSection: 'landing',
            isLoading: false,
            error: null
        };
    }
} 
