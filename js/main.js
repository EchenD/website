/**
 * Main Application Entry Point
 * Version: 2.0.0
 * Author: Echen Deligani
 * Last Updated: 2025-03-20
 */

import { App } from './core/app.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set initial header data-section attribute based on active section
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        const header = document.querySelector('header');
        if (header) {
            header.setAttribute('data-section', activeSection.id);
            console.log('Initial header data-section set to', activeSection.id);

            // Initialize Unity keyboard input based on active section
            if (activeSection.id === 'landing') {
                console.log('Landing section active on load, enabling Unity keyboard input');
                enableUnityKeyboardInput();
            } else {
                console.log(`${activeSection.id} section active on load, disabling Unity keyboard input`);
                disableUnityKeyboardInput();
            }
        }
    }

    initApp();
});

/**
 * Show error notification
 * @param {string} message - Error message to display
 * @param {number} duration - Duration in milliseconds to show the notification
 */
window.showError = function (message, duration = 3000) {
    // Check if there's already a notification with the same message
    const existingNotifications = document.querySelectorAll('.error-notification');
    for (const notification of existingNotifications) {
        if (notification.textContent === message) {
            // Already showing this message, no need to duplicate
            return;
        }
    }

    // Do not show placeholder image loading errors at startup
    if (message === 'Some images could not be loaded. Using placeholders instead.' &&
        document.readyState !== 'complete') {
        console.warn('Suppressing startup image loading error notification');
        return;
    }

    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.setAttribute('role', 'alert');
    notification.textContent = message;

    // Make notifications more minimalistic
    notification.style.padding = '8px 12px';
    notification.style.fontSize = '12px';
    notification.style.backgroundColor = 'rgba(200, 0, 0, 0.7)';
    notification.style.minHeight = '32px';

    document.body.appendChild(notification);

    // Remove notification after duration
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
};

/**
 * Initialize the application
 */
async function initApp() {
    try {
        // Update footer year
        updateFooterYear();

        // Initialize navigation
        initNavigation();

        // Check URL hash on page load and activate the corresponding section
        checkUrlHashAndNavigate();

        // Load works data
        await loadWorks();

        // Initialize the modal functionality
        initModal();

        // Initialize gallery and progress pages
        initDetailPages();

        // Initialize core application
        const app = new App();
        await app.init();

        // Add cleanup on page unload
        window.addEventListener('beforeunload', () => {
            app.dispose();
        });
    } catch (error) {
        console.error('Application initialization failed:', error);
        window.showError('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Check URL hash and navigate to the corresponding section
 */
function checkUrlHashAndNavigate() {
    const hash = window.location.hash;
    console.log('Current URL hash:', hash);

    if (hash) {
        const targetId = hash.substring(1);
        const targetSection = document.getElementById(targetId);
        const targetLink = document.querySelector(`.nav-link[href="#${targetId}"]`);

        console.log('Target section ID:', targetId);
        console.log('Target section element exists:', !!targetSection);
        console.log('Target link element exists:', !!targetLink);

        if (targetSection && targetLink) {
            // Update active section
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    window.currentSection = '#' + section.id;
                    console.log('Section activated:', section.id);

                    // Force the browser to apply styles by triggering a reflow
                    section.offsetHeight;

                    // Apply specific styling for landing section header
                    if (section.id === 'landing') {
                        const header = document.querySelector('header');
                        if (header) {
                            header.setAttribute('data-section', 'landing');
                            console.log('Setting header data-section to landing');
                        }
                        // Enable Unity keyboard input for landing section
                        console.log('Landing section activated, enabling Unity keyboard input');
                        enableUnityKeyboardInput();
                    } else {
                        // Disable Unity keyboard input for other sections
                        console.log(`${section.id} section activated, disabling Unity keyboard input`);
                        disableUnityKeyboardInput();
                    }
                } else {
                    section.classList.remove('active');
                }
            });

            // Update active link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            targetLink.classList.add('active');
        }
    } else {
        // If no hash, default to the landing section
        console.log('No hash in URL, defaulting to landing section');
        const landingSection = document.getElementById('landing');
        if (landingSection) {
            landingSection.classList.add('active');
            window.currentSection = '#landing';

            // Set header data attribute for the landing section
            const header = document.querySelector('header');
            if (header) {
                header.setAttribute('data-section', 'landing');
                console.log('Setting header data-section to landing');
            }

            // Enable Unity keyboard input for landing section
            console.log('Landing section activated, enabling Unity keyboard input');
            enableUnityKeyboardInput();

            // Update URL to match
            history.replaceState(null, null, '#landing');
        }
    }
}

/**
 * Enable Unity keyboard input
 */
function enableUnityKeyboardInput() {
    console.log('Attempting to enable Unity keyboard input...');
    if (window.unityInstance) {
        console.log('Unity instance found, proceeding with enable...');
        const container = document.getElementById('portfolio-container');
        if (container) {
            console.log('Portfolio container found, focusing...');
            container.focus();
            // Send message to Unity to enable input (1 for true)
            window.unityInstance.SendMessage('GameController', 'EnableInput', 1);
            console.log('Unity keyboard input enabled successfully');
        } else {
            console.warn('Portfolio container not found');
        }
    } else {
        console.warn('Unity instance not found');
    }
}

/**
 * Disable Unity keyboard input
 */
function disableUnityKeyboardInput() {
    console.log('Attempting to disable Unity keyboard input...');
    if (window.unityInstance) {
        console.log('Unity instance found, proceeding with disable...');
        // Send message to Unity to disable input (0 for false)
        window.unityInstance.SendMessage('GameController', 'EnableInput', 0);
        console.log('Unity keyboard input disabled successfully');
    } else {
        console.warn('Unity instance not found');
    }
}

/**
 * Load works data from JSON
 */
async function loadWorks() {
    try {
        const response = await fetch('./data/works.json');
        const data = await response.json();

        const artWorksGrid = document.getElementById('art-works-grid');
        const devWorksGrid = document.getElementById('dev-works-grid');

        if (!artWorksGrid || !devWorksGrid) {
            console.warn('Work grid containers not found');
            return;
        }

        // Clear existing content
        artWorksGrid.innerHTML = '';
        devWorksGrid.innerHTML = '';

        // Load art works
        data.art.forEach(work => {
            const workElement = createWorkElement(work);
            artWorksGrid.appendChild(workElement);
        });

        // Load development works
        data.development.forEach(work => {
            const workElement = createWorkElement(work);
            devWorksGrid.appendChild(workElement);
        });

        // Initialize lazy loading for images
        initLazyLoading();
    } catch (error) {
        console.error('Error loading works:', error);
        showError('Failed to load works data. Please refresh the page.');
    }
}

let missingImageNotificationShown = false;

/**
 * Create a work item element
 */
function createWorkElement(work) {
    const workDiv = document.createElement('div');
    workDiv.className = 'work-item fade-in';

    // Get thumbnail path
    const thumbnailPath = work.thumbnail || 'assets/images/placeholder.jpg';
    const isVideo = /\.(mp4|webm|ogg)$/i.test(thumbnailPath);

    workDiv.innerHTML = `
        <div class="work-image">
            ${isVideo ? `
                <video 
                    muted 
                    loop 
                    playsinline 
                    webkit-playsinline
                    preload="metadata"
                    poster="assets/images/placeholder.jpg"
                    onerror="window.handleMediaError(this);">
                    <source src="${thumbnailPath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            ` : `
                <img src="${thumbnailPath}" alt="${work.title}" loading="lazy" 
                    onerror="window.handleMediaError(this);">
            `}
            <div class="image-placeholder">Media not available</div>
        </div>
        <div class="work-info">
            <h4>${work.title}</h4>
            <p>${work.description}</p>
            <button class="read-more" data-work-id="${work.id}">Read More</button>
        </div>
    `;

    // Initialize video if present
    if (isVideo) {
        const video = workDiv.querySelector('video');
        if (video) {
            video.addEventListener('loadedmetadata', () => {
                video.classList.remove('loading');
                if (isElementInViewport(video)) {
                    video.play().catch(() => {
                        // Autoplay failed, show first frame
                        video.currentTime = 0;
                    });
                }
            });

            // Add intersection observer for video playback
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            video.play().catch(() => { });
                        } else {
                            video.pause();
                        }
                    });
                }, { threshold: 0.1 });

                observer.observe(video);
            }
        }
    }

    // Add click handlers
    const handleWorkItemClick = (e) => {
        if (!e.target.classList.contains('read-more')) {
            const readMoreBtn = workDiv.querySelector('.read-more');
            if (readMoreBtn) {
                e.preventDefault();
                e.stopPropagation();
                const workId = readMoreBtn.getAttribute('data-work-id');
                openWorkModal(workId);
            }
        }
    };

    const handleReadMoreClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const workId = e.target.getAttribute('data-work-id');
        openWorkModal(workId);
    };

    workDiv.addEventListener('click', handleWorkItemClick);
    const readMoreBtn = workDiv.querySelector('.read-more');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', handleReadMoreClick);
    }

    return workDiv;
}

// First, let's add a helper function for consistent video creation
function createVideoHtml(src, options = {}) {
    return `
        <video 
            muted 
            loop 
            playsinline 
            webkit-playsinline
            preload="metadata"
            poster="${options.poster || 'assets/images/placeholder.jpg'}"
            class="${options.class || ''}"
            ${options.controls ? 'controls' : ''}
            onerror="window.handleMediaError(this);">
            <source src="${src}" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    `;
}

// Helper function to safely play video
function playVideo(video) {
    if (!video) return;

    // Reset video to beginning
    video.currentTime = 0;

    // Add playsinline attributes for iOS
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Ensure video is muted for autoplay
    video.muted = true;
    video.setAttribute('muted', '');

    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch((error) => {
            console.warn('Video autoplay was prevented:', error);
            // Show first frame
            video.currentTime = 0;
            // Try playing again after user interaction
            document.addEventListener('click', () => {
                video.play().catch(() => { });
            }, { once: true });
        });
    }
}

// Helper function to check if element is in viewport
function isElementInViewport(el) {
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
        rect.top >= -rect.height &&
        rect.left >= -rect.width &&
        rect.top <= windowHeight &&
        rect.left <= windowWidth
    );
}

// Add intersection observer for video playback
function setupVideoObservers() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.paused) {
                    playVideo(video);
                }
            } else {
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '50px'
    });

    // Observe all videos
    document.querySelectorAll('video').forEach(video => {
        observer.observe(video);
    });
}

// Initialize video observers when DOM is loaded
document.addEventListener('DOMContentLoaded', setupVideoObservers);

// Update video creation in templates
function createVideoTemplate(src, options = {}) {
    const qualityLevels = options.qualityLevels || [
        { width: 1920, height: 1080, bitrate: '5000k' },
        { width: 1280, height: 720, bitrate: '2500k' },
        { width: 854, height: 480, bitrate: '1000k' }
    ];

    const sources = qualityLevels.map(quality => {
        const qualitySrc = src.replace(/\.[^/.]+$/, '') +
            `_${quality.width}x${quality.height}_${quality.bitrate}.mp4`;
        return `<source src="${qualitySrc}" type="video/mp4" 
            data-width="${quality.width}" 
            data-height="${quality.height}" 
            data-bitrate="${quality.bitrate}">`;
    }).join('\n');

    return `
        <video 
            muted 
            loop 
            playsinline 
            webkit-playsinline
            preload="metadata"
            ${options.poster ? `poster="${options.poster}"` : ''}
            class="loading"
            onerror="window.handleMediaError(this);"
            onloadeddata="this.classList.remove('loading'); if(isElementInViewport(this) && !this.hasAttribute('controls')) { playVideo(this); }">
            ${sources}
            Your browser does not support the video tag.
        </video>
    `;
}

// Add network quality detection
function detectNetworkQuality() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType) {
            switch (connection.effectiveType) {
                case '4g':
                    return 'high';
                case '3g':
                    return 'medium';
                case '2g':
                    return 'low';
                default:
                    return 'medium';
            }
        }
    }
    return 'medium';
}

// Update video quality based on network conditions
function updateVideoQuality(video) {
    const quality = detectNetworkQuality();
    const sources = video.querySelectorAll('source');
    let selectedSource = null;

    switch (quality) {
        case 'high':
            selectedSource = sources[0]; // 1080p
            break;
        case 'medium':
            selectedSource = sources[1]; // 720p
            break;
        case 'low':
            selectedSource = sources[2]; // 480p
            break;
    }

    if (selectedSource && video.currentSrc !== selectedSource.src) {
        video.src = selectedSource.src;
        video.load();
    }
}

// Monitor network quality changes
if ('connection' in navigator) {
    navigator.connection.addEventListener('change', () => {
        document.querySelectorAll('video').forEach(updateVideoQuality);
    });
}

// Update handleMediaError function
window.handleMediaError = function (media) {
    console.warn(`Failed to load media: ${media.src}`);

    const isVideo = media.tagName.toLowerCase() === 'video';
    const placeholderDiv = media.nextElementSibling?.classList.contains('image-placeholder') ?
        media.nextElementSibling : null;

    // Remove loading state if present
    media.classList.remove('loading');

    // Handle videos differently from images
    if (isVideo) {
        media.style.display = 'none';
        if (placeholderDiv) {
            placeholderDiv.style.display = 'flex';
            placeholderDiv.textContent = 'Video not available';
        }
    } else {
        // For images, preload placeholder before showing
        if (!media.src.includes('placeholder.jpg')) {
            const placeholderImg = new Image();

            placeholderImg.onload = () => {
                media.src = 'assets/images/placeholder.jpg';
                media.style.display = 'block';
                if (placeholderDiv) {
                    placeholderDiv.style.display = 'none';
                }
            };

            placeholderImg.onerror = () => {
                media.style.display = 'none';
                if (placeholderDiv) {
                    placeholderDiv.style.display = 'flex';
                    placeholderDiv.textContent = 'Image not available';
                }
            };

            placeholderImg.src = 'assets/images/placeholder.jpg';
        } else {
            // Already trying to show placeholder and it failed
            media.style.display = 'none';
            if (placeholderDiv) {
                placeholderDiv.style.display = 'flex';
            }
        }
    }

    // Add error styling
    media.classList.add('media-error');
    media.title = `${isVideo ? 'Video' : 'Image'} could not be loaded`;

    // Show error notification (rate limited)
    if (!window.missingMediaNotificationShown) {
        window.showError(`Some media files could not be loaded. Using ${isVideo ? 'placeholders' : 'placeholder images'} instead.`);
        window.missingMediaNotificationShown = true;
        setTimeout(() => {
            window.missingMediaNotificationShown = false;
        }, 5000);
    }

    return true;
};

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    } else {
        // Fallback for browsers that don't support native lazy loading
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers without IntersectionObserver
            lazyImages.forEach(img => {
                img.classList.add('loaded');
            });
        }
    }
}

/**
 * Initialize modal functionality
 */
function initModal() {
    // Get modal elements
    const modal = document.getElementById('workModal');

    if (!modal) {
        console.warn('Modal element not found');
        return;
    }

    const closeBtn = modal.querySelector('.modal-close');

    // Close button event
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
        });
    }

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            closeModal();
        }
    });

    // Prevent event bubbling from modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

/**
 * Initialize gallery and progress pages
 */
function initDetailPages() {
    // Check if pages already exist, if not create them
    if (!document.getElementById('galleryPage')) {
        const galleryPage = document.createElement('div');
        galleryPage.id = 'galleryPage';
        galleryPage.className = 'gallery-page';
        galleryPage.innerHTML = `
            <div class="page-header">
                <h2 class="gallery-title">Gallery</h2>
                <button class="back-button" id="galleryBackBtn">
                    <span>←</span> Back to Work
                </button>
            </div>
            <div class="page-content">
                <div class="gallery-grid" id="galleryGrid"></div>
            </div>
        `;
        document.body.appendChild(galleryPage);

        // Add event listener to back button
        const galleryBackBtn = document.getElementById('galleryBackBtn');
        if (galleryBackBtn) {
            galleryBackBtn.addEventListener('click', closeGalleryPage);
        }
    }

    if (!document.getElementById('progressPage')) {
        const progressPage = document.createElement('div');
        progressPage.id = 'progressPage';
        progressPage.className = 'progress-page';
        progressPage.innerHTML = `
            <div class="page-header">
                <h2 class="progress-title">Work Progress</h2>
                <button class="back-button" id="progressBackBtn">
                    <span>←</span> Back to Work
                </button>
            </div>
            <div class="page-content">
                <div class="progress-timeline" id="progressTimeline"></div>
            </div>
        `;
        document.body.appendChild(progressPage);

        // Add event listener to back button
        const progressBackBtn = document.getElementById('progressBackBtn');
        if (progressBackBtn) {
            progressBackBtn.addEventListener('click', closeProgressPage);
        }
    }
}

/**
 * Open work modal with details
 */
async function openWorkModal(workId) {
    try {
        console.log('Opening modal for work ID:', workId);

        // Get modal and check if it exists
        const modal = document.getElementById('workModal');
        if (!modal) {
            console.error('Modal element not found');
            showError('Could not open project details. Please try again.');
            return;
        }

        // Close modal if it's already open (fixes potential stuck states)
        if (modal.classList.contains('visible')) {
            console.log('Modal appears stuck in visible state, closing it first');
            closeModal();
            // Small delay to ensure modal is fully closed before reopening
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;

        // Reset modal styles
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';

        // Show loading state
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Adjust modal position to account for header
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            // Center the modal in the viewport, accounting for header
            modalContent.style.marginTop = `${headerHeight + 20}px`;
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
            // Set maximum height to prevent overflow
            modalContent.style.maxHeight = `calc(100vh - ${headerHeight + 40}px)`;
            // Ensure modal is centered horizontally
            modalContent.style.margin = `${headerHeight + 20}px auto 0`;
            modalContent.style.overflowY = 'auto';
        }

        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = '<div class="loading-spinner"></div>';
        }

        // Fetch work detail data
        console.log('Fetching work details from:', `./data/works/${workId}.json`);
        const response = await fetch(`./data/works/${workId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch work details (${response.status})`);
        }

        const workDetail = await response.json();
        console.log('Work details loaded successfully');

        // Store current work ID for gallery and progress pages
        modal.dataset.currentWorkId = workId;

        // Get modal elements
        const modalTitle = modal.querySelector('.modal-title');

        // Clear modal content
        if (modalBody) {
            modalBody.innerHTML = '';

            // Create new content structure
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="work-gallery"></div>
                <div class="work-details">
                    <div class="work-description"></div>
                    <div class="work-meta">
                        <div class="meta-item">
                            <strong>Date:</strong>
                            <span class="work-date"></span>
                        </div>
                        <div class="meta-item">
                            <strong>Tools:</strong>
                            <span class="work-tools"></span>
                        </div>
                        <div class="meta-item">
                            <strong>Role:</strong>
                            <span class="work-role"></span>
                        </div>
                    </div>
                    <div class="work-links">
                        <button class="view-gallery-btn">View Gallery</button>
                        <button class="view-progress-btn">View Progress</button>
                    </div>
                </div>
            `;

            modalBody.appendChild(content);
        } else {
            console.error('Modal body not found');
            showError('Could not display project details. Please try again.');
            closeModal();
            return;
        }

        // Re-get elements after reconstruction
        const modalDescription = modal.querySelector('.work-description');
        const modalGallery = modal.querySelector('.work-gallery');
        const modalDate = modal.querySelector('.work-date');
        const modalTools = modal.querySelector('.work-tools');
        const modalRole = modal.querySelector('.work-role');
        const galleryBtn = modal.querySelector('.view-gallery-btn');
        const progressBtn = modal.querySelector('.view-progress-btn');

        // Populate modal content
        if (modalTitle) modalTitle.textContent = workDetail.title;
        if (modalDescription) modalDescription.innerHTML = workDetail.fullDescription || workDetail.description;
        if (modalDate) modalDate.textContent = workDetail.date;
        if (modalTools) modalTools.textContent = workDetail.tools ? workDetail.tools.join(', ') : '';
        if (modalRole) modalRole.textContent = workDetail.role || '';

        // Update modal gallery creation - use the images array instead of gallery if it exists
        if (modalGallery) {
            // Use images array for modal if it exists, otherwise fall back to gallery
            const displayImages = workDetail.images && workDetail.images.length > 0 ?
                workDetail.images :
                (workDetail.gallery && workDetail.gallery.length > 0 ? workDetail.gallery : []);

            if (displayImages.length > 0) {
                modalGallery.innerHTML = displayImages.map((image, index) => {
                    const isVideo = /\.(mp4|webm|ogg)$/i.test(image.url);
                    const thumbnailUrl = image.thumbnail || image.url || 'assets/images/placeholder.jpg';
                    const fullUrl = image.url || 'assets/images/placeholder.jpg';

                    return `
                        <figure class="gallery-item" data-full-url="${fullUrl}" data-index="${index}">
                            ${isVideo ? createVideoHtml(thumbnailUrl) : `
                                <img src="${thumbnailUrl}" 
                                    alt="${image.caption}" 
                                    loading="lazy" 
                                    data-full-url="${fullUrl}"
                                    onerror="window.handleMediaError(this);">
                            `}
                            <div class="image-placeholder">Media not available</div>
                            <figcaption>${image.caption}</figcaption>
                        </figure>
                    `;
                }).join('');

                // Initialize videos after adding them to DOM
                modalGallery.querySelectorAll('video').forEach(video => {
                    initializeVideo(video);
                });

                // Add click event for fullscreen viewing with collection context
                modalGallery.querySelectorAll('.gallery-item').forEach((item, index) => {
                    item.addEventListener('click', function () {
                        const fullUrl = this.getAttribute('data-full-url');
                        const caption = this.querySelector('figcaption')?.textContent || '';
                        if (fullUrl) {
                            openFullscreenImage(fullUrl, caption, displayImages, index);
                        }
                    });
                });
            } else {
                // Use placeholder if no gallery
                modalGallery.innerHTML = `
                    <figure class="gallery-item">
                        <img src="assets/images/placeholder.jpg" 
                             alt="Placeholder" 
                             loading="lazy"
                             onerror="window.handleMediaError(this);">
                        <div class="image-placeholder">Media not available</div>
                        <figcaption>Placeholder image</figcaption>
                    </figure>
                `;
            }
        }

        // Add event listeners to buttons
        if (galleryBtn) {
            // Remove any existing event listeners
            const newGalleryBtn = galleryBtn.cloneNode(true);
            if (galleryBtn.parentNode) {
                galleryBtn.parentNode.replaceChild(newGalleryBtn, galleryBtn);
            }

            // Add new event listener
            newGalleryBtn.addEventListener('click', function () {
                console.log('Gallery button clicked');
                // Store reference to the current work detail for use after modal is closed
                window.currentWorkDetail = workDetail;
                openGalleryPage(workDetail);
                closeModal();
            });
        }

        if (progressBtn) {
            // Remove any existing event listeners
            const newProgressBtn = progressBtn.cloneNode(true);
            if (progressBtn.parentNode) {
                progressBtn.parentNode.replaceChild(newProgressBtn, progressBtn);
            }

            // Add new event listener
            newProgressBtn.addEventListener('click', function () {
                console.log('Progress button clicked');
                // Store reference to the current work detail for use after modal is closed
                window.currentWorkDetail = workDetail;
                openProgressPage(workDetail);
                closeModal();
            });
        }

    } catch (error) {
        console.error('Error loading work detail:', error);
        showError('Failed to load work details. Please try again.');
        closeModal();
    }
}

/**
 * Open gallery page for a work
 */
function openGalleryPage(workDetail) {
    console.log('Opening gallery page for:', workDetail.title);
    const galleryPage = document.getElementById('galleryPage');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryTitle = document.querySelector('.gallery-title');
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;

    if (!galleryPage || !galleryGrid) {
        console.error('Gallery page elements not found');
        showError('Could not open gallery. Please try again.');
        return;
    }

    // Adjust page header position
    const pageHeader = galleryPage.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.top = `${headerHeight}px`;
        pageHeader.style.position = 'sticky';
    }

    // Adjust content padding to account for header and page header
    const pageContent = galleryPage.querySelector('.page-content');
    if (pageContent) {
        pageContent.style.paddingTop = `${headerHeight + 50}px`;
    }

    // Update title
    if (galleryTitle) {
        galleryTitle.textContent = `${workDetail.title} - Gallery`;
    }

    // Clear previous content
    galleryGrid.innerHTML = '';

    // Add gallery items
    if (workDetail.gallery && workDetail.gallery.length > 0) {
        workDetail.gallery.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';

            const thumbnailUrl = image.thumbnail || image.url || 'assets/images/placeholder.jpg';
            const fullUrl = image.url || 'assets/images/placeholder.jpg';
            const isVideo = /\.(mp4|webm|ogg)$/i.test(fullUrl);

            galleryItem.innerHTML = `
                <div class="media-container">
                    ${isVideo ? createVideoHtml(thumbnailUrl) : `
                        <img src="${thumbnailUrl}" alt="${image.caption || ''}" loading="lazy" 
                            onerror="window.handleMediaError(this);">
                    `}
                    <div class="image-placeholder">Media not available</div>
                </div>
                <div class="gallery-caption">${image.caption || ''}</div>
                <div class="gallery-fullscreen-btn" data-src="${fullUrl}" data-caption="${image.caption || ''}" data-index="${index}">
                    <span>⤢</span>
                </div>
            `;
            galleryGrid.appendChild(galleryItem);

            // Initialize video if present
            const video = galleryItem.querySelector('video');
            if (video) {
                initializeVideo(video);
            }

            // Add click event for fullscreen view
            const fullscreenBtn = galleryItem.querySelector('.gallery-fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); // Prevent event bubbling
                    const index = parseInt(this.getAttribute('data-index'), 10) || 0;
                    openFullscreenImage(
                        this.getAttribute('data-src'),
                        this.getAttribute('data-caption'),
                        workDetail.gallery,
                        index
                    );
                });
            }

            // Also make the whole gallery item clickable for fullscreen
            galleryItem.addEventListener('click', function () {
                const btn = this.querySelector('.gallery-fullscreen-btn');
                if (btn) {
                    const index = parseInt(btn.getAttribute('data-index'), 10) || 0;
                    openFullscreenImage(
                        btn.getAttribute('data-src'),
                        btn.getAttribute('data-caption'),
                        workDetail.gallery,
                        index
                    );
                }
            });
        });
    } else {
        console.warn('No gallery items found, adding placeholders');
        // Add placeholder if no gallery
        for (let i = 0; i < 6; i++) {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item fade-in';
            galleryItem.innerHTML = `
                <img src="assets/images/placeholder.jpg" alt="Placeholder" loading="lazy" onerror="window.handleMediaError(this);">
                <div class="image-placeholder">Media not available</div>
                <div class="gallery-caption">Placeholder image ${i + 1}</div>
                <div class="gallery-fullscreen-btn" data-src="assets/images/placeholder.jpg" data-caption="Placeholder image ${i + 1}">
                    <span>⤢</span>
                </div>
            `;
            galleryGrid.appendChild(galleryItem);

            // Add click event for fullscreen view
            const fullscreenBtn = galleryItem.querySelector('.gallery-fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); // Prevent event bubbling
                    openFullscreenImage(this.getAttribute('data-src'), this.getAttribute('data-caption'));
                });
            }

            // Also make the whole gallery item clickable for fullscreen
            galleryItem.addEventListener('click', function () {
                const btn = this.querySelector('.gallery-fullscreen-btn');
                if (btn) {
                    openFullscreenImage(btn.getAttribute('data-src'), btn.getAttribute('data-caption'));
                }
            });
        }
    }

    // Show gallery page
    galleryPage.classList.add('active');
    galleryPage.style.visibility = 'visible';
    galleryPage.style.opacity = '1';
    galleryPage.style.transform = 'translateY(0)';
    document.body.style.overflow = 'hidden';

    // Ensure page content starts at the top
    if (pageContent) {
        setTimeout(() => {
            pageContent.scrollTop = 0;
        }, 50);
    }
}

/**
 * Open progress page for a work
 */
function openProgressPage(workDetail) {
    console.log('Opening progress page for:', workDetail.title);
    const progressPage = document.getElementById('progressPage');
    const progressTimeline = document.getElementById('progressTimeline');
    const progressTitle = document.querySelector('.progress-title');
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;

    if (!progressPage || !progressTimeline) {
        console.error('Progress page elements not found');
        showError('Could not open progress timeline. Please try again.');
        return;
    }

    // Reset scroll position immediately
    progressPage.scrollTop = 0;
    progressTimeline.scrollTop = 0;

    // Adjust page header position
    const pageHeader = progressPage.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.top = `${headerHeight}px`;
        pageHeader.style.position = 'sticky';
    }

    // Adjust content padding to account for header and page header
    const pageContent = progressPage.querySelector('.page-content');
    if (pageContent) {
        pageContent.style.paddingTop = `${headerHeight + 50}px`;
        // Reset scroll position of the content container
        pageContent.scrollTop = 0;
    }

    // Update title
    if (progressTitle) {
        progressTitle.textContent = `${workDetail.title} - Work Progress`;
    }

    // Clear previous content
    progressTimeline.innerHTML = '';

    // Create a processImages array for navigation
    const processImages = workDetail.process && workDetail.process.length > 0
        ? workDetail.process.map(step => ({
            src: step.image || step.thumbnail || 'assets/images/placeholder.jpg',
            caption: step.title || '',
            description: step.description || ''
        }))
        : [];

    // Add progress items
    if (workDetail.process && workDetail.process.length > 0) {
        workDetail.process.forEach((step, index) => {
            const progressItem = document.createElement('div');
            progressItem.className = 'progress-item fade-in';

            // Create progress content with optional media
            const thumbnailUrl = step.thumbnail || step.image || 'assets/images/placeholder.jpg';
            const fullUrl = step.image || 'assets/images/placeholder.jpg';
            const isVideo = /\.(mp4|webm|ogg)$/i.test(fullUrl);

            progressItem.innerHTML = `
                <div class="progress-content">
                    <div class="media-container" data-full-url="${fullUrl}" data-index="${index}">
                        ${isVideo ? `
                            <video 
                                muted 
                                loop 
                                playsinline 
                                webkit-playsinline
                                preload="metadata"
                                poster="assets/images/placeholder.jpg"
                                onerror="window.handleMediaError(this);">
                                <source src="${thumbnailUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        ` : `
                            <img src="${thumbnailUrl}" alt="${step.title}" loading="lazy" 
                                onerror="window.handleMediaError(this);">
                        `}
                        <div class="image-placeholder">Media not available</div>
                    </div>
                    <div class="progress-date">${step.date || `Phase ${index + 1}`}</div>
                    <h3>${step.title}</h3>
                    <p>${step.description}</p>
                </div>
            `;
            progressTimeline.appendChild(progressItem);

            // Initialize video if present
            const video = progressItem.querySelector('video');
            if (video) {
                initializeVideo(video);
            }

            // Add click event for fullscreen view
            const mediaContainer = progressItem.querySelector('.media-container');
            if (mediaContainer) {
                mediaContainer.style.cursor = 'pointer';
                mediaContainer.addEventListener('click', function () {
                    const fullUrl = this.getAttribute('data-full-url');
                    const index = parseInt(this.getAttribute('data-index'), 10) || 0;
                    openFullscreenImage(fullUrl, step.title, processImages, index);
                });
            }
        });
    } else {
        console.warn('No process steps found, adding placeholders');
        // Add placeholders if no process steps
        for (let i = 0; i < 4; i++) {
            const progressItem = document.createElement('div');
            progressItem.className = 'progress-item fade-in';

            progressItem.innerHTML = `
                <div class="progress-content">
                    <img src="assets/images/placeholder.jpg" alt="Placeholder" loading="lazy" onerror="window.handleMediaError(this);">
                    <div class="image-placeholder">Media not available</div>
                    <div class="progress-date">Phase ${i + 1}</div>
                    <h3>Sample Progress Step ${i + 1}</h3>
                    <p>This is a placeholder for the project progress steps. In a real project, this would contain detailed information about the development process.</p>
                </div>
            `;
            progressTimeline.appendChild(progressItem);

            // Add click event for fullscreen image view
            const img = progressItem.querySelector('img');
            if (img) {
                img.addEventListener('click', function () {
                    openFullscreenImage(this.src, `Sample Progress Step ${i + 1}`);
                });
                img.style.cursor = 'pointer';
            }
        }
    }

    // Show progress page with scroll reset
    progressPage.classList.add('active');
    progressPage.style.visibility = 'visible';
    progressPage.style.opacity = '1';
    progressPage.style.transform = 'translateY(0)';
    document.body.style.overflow = 'hidden';

    // Ensure scroll position is reset after the page becomes visible
    requestAnimationFrame(() => {
        if (pageContent) {
            pageContent.scrollTop = 0;
        }
        progressPage.scrollTop = 0;
        progressTimeline.scrollTop = 0;
    });

    // Double-check scroll position after animation
    setTimeout(() => {
        if (pageContent) {
            pageContent.scrollTop = 0;
        }
        progressPage.scrollTop = 0;
        progressTimeline.scrollTop = 0;
    }, 100);
}

// Add a global variable to track fullscreen viewer state
let fullscreenState = {
    images: [],  // Array of {src, caption} objects
    currentIndex: 0,
    context: '' // 'gallery', 'progress', 'modal', etc.
};

/**
 * Open fullscreen image view
 */
function openFullscreenImage(src, caption, imageCollection = null, index = 0) {
    const fullscreenViewer = document.getElementById('fullscreenViewer');
    if (!fullscreenViewer) return;

    if (src && src.startsWith('/')) {
        src = src.substring(1);
    }

    if (!src) {
        src = 'assets/images/placeholder.jpg';
    }

    // Update fullscreen state
    if (imageCollection && Array.isArray(imageCollection)) {
        fullscreenState.images = imageCollection;
        fullscreenState.currentIndex = index;
        // Enable navigation only when we have a collection with multiple items
        fullscreenState.hasNavigation = imageCollection.length > 1;
    } else {
        // Single image mode - disable navigation
        fullscreenState.images = [{ src, caption }];
        fullscreenState.currentIndex = 0;
        fullscreenState.hasNavigation = false;
    }

    const isVideo = /\.(mp4|webm|ogg)$/i.test(src);

    // Create the initial loading structure
    fullscreenViewer.innerHTML = `
        <div class="fullscreen-background"></div>
        <div class="fullscreen-content">
            ${isVideo ? createVideoHtml(src, { controls: true }) : `
                <div class="image-zoom-container">
                    <img alt="${caption || 'Fullscreen image'}" loading="eager" 
                        aria-hidden="true">
                </div>
            `}
            <div class="image-placeholder" style="display: none;">Media not available</div>
            ${caption ? `<div class="fullscreen-caption">${caption}</div>` : ''}
            <button class="fullscreen-close">✕</button>
            ${!isVideo ? `<button class="zoom-reset-btn">Reset Zoom</button>` : ''}
            ${fullscreenState.hasNavigation ? `
                <button class="fullscreen-nav-btn prev-btn" aria-label="Previous image">❮</button>
                <button class="fullscreen-nav-btn next-btn" aria-label="Next image">❯</button>
                <div class="fullscreen-counter">${fullscreenState.currentIndex + 1} / ${fullscreenState.images.length}</div>
            ` : ''}
        </div>
    `;

    // Show the viewer immediately with loading state
    fullscreenViewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Handle image loading (for non-video content)
    const content = fullscreenViewer.querySelector('.fullscreen-content');
    if (content && !isVideo) {
        // Add loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        content.appendChild(loadingSpinner);

        const imageContainer = content.querySelector('.image-zoom-container');
        const img = content.querySelector('img');

        if (img) {
            // Preload image to get dimensions
            const preloadImg = new Image();

            // Set up image loading and error handlers
            preloadImg.onload = function () {
                // Update the placeholder aspect ratio based on the real image dimensions
                const imgAspect = preloadImg.height / preloadImg.width;
                if (imageContainer && imgAspect) {
                    // Apply the correct aspect ratio from the loaded image
                    imageContainer.style.setProperty('--img-aspect', `${imgAspect * 100}%`);
                }

                // Now set the visible image src
                img.src = preloadImg.src;
                img.style.opacity = '1';

                // Remove loading spinner
                loadingSpinner.remove();

                // Initialize zoom and pan after image loads
                initializeImageZoomPan(img);
            };

            preloadImg.onerror = function () {
                // Handle error by showing placeholder
                img.src = 'assets/images/placeholder.jpg';
                img.style.opacity = '1';
                loadingSpinner.remove();

                // Show error notification
                window.showError('Image could not be loaded');

                // Initialize zoom and pan with placeholder
                initializeImageZoomPan(img);
            };

            // Start image loading - make it initially invisible
            img.style.opacity = '0';
            preloadImg.src = src;
        }
    }

    // Initialize video if present
    const video = fullscreenViewer.querySelector('video');
    if (video) {
        initializeVideo(video);
        // Add a loading spinner for video content
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        content.appendChild(loadingSpinner);

        video.addEventListener('loadeddata', function () {
            loadingSpinner.remove();
        });
    }

    // Add close button event
    const closeBtn = fullscreenViewer.querySelector('.fullscreen-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreenImage);
    }

    // Close on background click
    const background = fullscreenViewer.querySelector('.fullscreen-background');
    if (background) {
        background.addEventListener('click', closeFullscreenImage);
    }

    // Add navigation button events
    if (fullscreenState.hasNavigation) {
        const prevBtn = fullscreenViewer.querySelector('.prev-btn');
        const nextBtn = fullscreenViewer.querySelector('.next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', showPreviousFullscreenImage);
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', showNextFullscreenImage);
        }
    }

    // Close on ESC key
    document.addEventListener('keydown', handleFullscreenKeydown);

    // Add reset zoom button event
    const resetBtn = fullscreenViewer.querySelector('.zoom-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            const img = fullscreenViewer.querySelector('img');
            if (img) {
                resetImageZoomPan(img);
            }
        });
    }

    // Pause video when closing fullscreen
    if (isVideo) {
        const video = fullscreenViewer.querySelector('video');
        if (video) {
            fullscreenViewer.addEventListener('click', () => {
                video.pause();
            }, { once: true });
        }
    }
}

/**
 * Navigate to the previous image in fullscreen view
 */
function showPreviousFullscreenImage() {
    if (!fullscreenState.hasNavigation) return;

    // Reset to the last image if at the beginning
    let newIndex = fullscreenState.currentIndex - 1;
    if (newIndex < 0) {
        newIndex = fullscreenState.images.length - 1;
    }

    // Get the previous image data
    const prevImage = fullscreenState.images[newIndex];
    if (!prevImage) return;

    // Update current index
    fullscreenState.currentIndex = newIndex;

    // Open the new image while maintaining the collection context
    openFullscreenImage(
        prevImage.src || prevImage.url,
        prevImage.caption || '',
        fullscreenState.images,
        newIndex
    );
}

/**
 * Navigate to the next image in fullscreen view
 */
function showNextFullscreenImage() {
    if (!fullscreenState.hasNavigation) return;

    // Loop back to the first image if at the end
    let newIndex = fullscreenState.currentIndex + 1;
    if (newIndex >= fullscreenState.images.length) {
        newIndex = 0;
    }

    // Get the next image data
    const nextImage = fullscreenState.images[newIndex];
    if (!nextImage) return;

    // Update current index
    fullscreenState.currentIndex = newIndex;

    // Open the new image while maintaining the collection context
    openFullscreenImage(
        nextImage.src || nextImage.url,
        nextImage.caption || '',
        fullscreenState.images,
        newIndex
    );
}

/**
 * Handle keyboard events for fullscreen view
 */
function handleFullscreenKeydown(e) {
    if (e.key === 'Escape') {
        closeFullscreenImage();
    } else if (e.key === 'ArrowLeft' && fullscreenState.hasNavigation) {
        // Only handle left arrow for navigation when not zoomed in
        const img = document.querySelector('.fullscreen-content img');
        const isZoomed = img && img.style.transform && img.style.transform.includes('scale') &&
            !img.style.transform.includes('scale(1)');

        if (!isZoomed) {
            showPreviousFullscreenImage();
            e.preventDefault();
        }
    } else if (e.key === 'ArrowRight' && fullscreenState.hasNavigation) {
        // Only handle right arrow for navigation when not zoomed in
        const img = document.querySelector('.fullscreen-content img');
        const isZoomed = img && img.style.transform && img.style.transform.includes('scale') &&
            !img.style.transform.includes('scale(1)');

        if (!isZoomed) {
            showNextFullscreenImage();
            e.preventDefault();
        }
    }
}

/**
 * Initialize zoom and pan functionality for fullscreen image
 */
function initializeImageZoomPan(img) {
    if (!img) return;

    const container = img.closest('.image-zoom-container');
    if (!container) return;

    // Set initial transform values
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX, startY, initialTranslateX, initialTranslateY;

    // Variables to prevent click after drag
    let hasMoved = false;
    let dragDistance = 0;
    let dragTimeout = null;
    const MIN_DRAG_THRESHOLD = 5; // Minimum pixels to consider a drag vs a click
    const DRAG_TIMEOUT_DELAY = 250; // ms to wait after drag before allowing clicks

    // Apply transform
    function applyTransform() {
        // Auto-reset position when scale is 1
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // Reset zoom and pan
    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
        container.style.cursor = 'zoom-in';
    }

    // Make the reset function available globally
    window.resetImageZoomPan = resetZoom;

    // Zoom at specific point (used by both mouse wheel and click)
    function zoomAtPoint(clientX, clientY, zoomIn) {
        // Get image dimensions and position
        const imgRect = img.getBoundingClientRect();

        // Calculate mouse position relative to the image's current transformed state
        const imgCenterX = imgRect.left + imgRect.width / 2;
        const imgCenterY = imgRect.top + imgRect.height / 2;

        // Mouse position relative to image center, adjusted for current scale and translation
        const relativeX = (clientX - imgCenterX) / scale;
        const relativeY = (clientY - imgCenterY) / scale;

        // Determine zoom factor
        const zoomFactor = zoomIn ? 1.25 : 0.8;

        // Calculate new scale with limits
        const newScale = Math.max(1, Math.min(5, scale * zoomFactor));

        // Check if we're going to scale 1 (fully zoomed out)
        const wasZoomedIn = scale > 1;
        const willBeZoomedOut = newScale === 1;

        // Only zoom if scale changes
        if (newScale !== scale) {
            // If going from zoomed in to fully zoomed out, just reset
            if (wasZoomedIn && willBeZoomedOut) {
                resetZoom();
            } else {
                // Calculate new position to maintain mouse position relative to image
                const newTranslateX = translateX - (relativeX * (newScale - scale));
                const newTranslateY = translateY - (relativeY * (newScale - scale));

                // Update scale and position
                scale = newScale;
                translateX = newTranslateX;
                translateY = newTranslateY;

                applyTransform();

                // Update cursor based on zoom level
                container.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
            }
        }
    }

    // Mouse wheel zoom
    const wheelHandler = function (e) {
        e.preventDefault();
        zoomAtPoint(e.clientX, e.clientY, e.deltaY < 0);
    };
    container.addEventListener('wheel', wheelHandler);

    // Click to zoom in/out
    const clickHandler = function (e) {
        // Only handle clicks when not dragging and not right after a drag operation
        if (!isDragging && !hasMoved && !dragTimeout) {
            // Left click to zoom in, right click to zoom out
            if (e.button === 0) {
                // Left click - zoom in
                zoomAtPoint(e.clientX, e.clientY, true);
            }
            e.preventDefault(); // Prevent default behavior for clicks
        }
    };
    container.addEventListener('click', clickHandler);

    // Right click to zoom out
    const contextMenuHandler = function (e) {
        // Only handle right-clicks when not dragging and not right after a drag
        if (!isDragging && !hasMoved && !dragTimeout) {
            // Right click - zoom out
            zoomAtPoint(e.clientX, e.clientY, false);
            e.preventDefault(); // Prevent context menu
        }
    };
    container.addEventListener('contextmenu', contextMenuHandler);

    // Mouse drag pan
    const mousedownHandler = function (e) {
        // Clear any existing drag timeout
        if (dragTimeout) {
            clearTimeout(dragTimeout);
            dragTimeout = null;
        }

        // Reset drag tracking on new mouse down
        hasMoved = false;
        dragDistance = 0;

        // Only initiate drag on left mouse button (button 0)
        if (e.button === 0 && scale > 1) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialTranslateX = translateX;
            initialTranslateY = translateY;
            container.style.cursor = 'grabbing';
        }
    };
    container.addEventListener('mousedown', mousedownHandler);

    const mousemoveHandler = function (e) {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Calculate drag distance using Pythagorean theorem
            dragDistance = Math.sqrt(dx * dx + dy * dy);

            // Mark as moved if drag distance exceeds threshold
            if (dragDistance > MIN_DRAG_THRESHOLD) {
                hasMoved = true;
            }

            translateX = initialTranslateX + dx;
            translateY = initialTranslateY + dy;
            applyTransform();
        }
    };
    document.addEventListener('mousemove', mousemoveHandler);

    const mouseupHandler = function (e) {
        // Only handle left mouse button events (button 0)
        if (e.button === 0 && isDragging) {
            isDragging = false;
            container.style.cursor = scale > 1 ? 'grab' : 'zoom-in';

            // If we've moved beyond the threshold, block clicks temporarily
            if (hasMoved) {
                // Set a timeout to re-enable click events
                dragTimeout = setTimeout(() => {
                    hasMoved = false;
                    dragTimeout = null;
                }, DRAG_TIMEOUT_DELAY);
            }
        }
    };
    document.addEventListener('mouseup', mouseupHandler);

    // Double click to reset
    const dblclickHandler = resetZoom;
    container.addEventListener('dblclick', dblclickHandler);

    // Touch events for mobile
    let lastTouchDistance = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let lastPinchCenter = { x: 0, y: 0 };
    let touchMoved = false;
    let touchDragDistance = 0;

    const touchstartHandler = function (e) {
        e.preventDefault();

        // Reset touch tracking variables
        touchMoved = false;
        touchDragDistance = 0;

        // Clear any existing drag timeout
        if (dragTimeout) {
            clearTimeout(dragTimeout);
            dragTimeout = null;
        }

        if (e.touches.length === 1) {
            // Single touch for panning
            isDragging = scale > 1;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialTranslateX = translateX;
            initialTranslateY = translateY;
        } else if (e.touches.length === 2) {
            // Two touches for pinch zoom
            isDragging = false;

            // Calculate initial distance between two touches
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // Calculate midpoint for zoom center
            lastTouchX = (touch1.clientX + touch2.clientX) / 2;
            lastTouchY = (touch1.clientY + touch2.clientY) / 2;

            // Store pinch center for reference
            lastPinchCenter = {
                x: lastTouchX,
                y: lastTouchY
            };
        }
    };
    container.addEventListener('touchstart', touchstartHandler);

    const touchmoveHandler = function (e) {
        e.preventDefault(); // Prevent default scrolling

        if (e.touches.length === 1 && isDragging) {
            // Single touch pan
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;

            // Calculate touch drag distance
            touchDragDistance = Math.sqrt(dx * dx + dy * dy);

            // Mark as moved if touch drag distance exceeds threshold
            if (touchDragDistance > MIN_DRAG_THRESHOLD) {
                touchMoved = true;
            }

            translateX = initialTranslateX + dx;
            translateY = initialTranslateY + dy;
            applyTransform();
        } else if (e.touches.length === 2) {
            // Two touches pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            // Calculate current distance
            const currentTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // Get current pinch center
            const currentTouchX = (touch1.clientX + touch2.clientX) / 2;
            const currentTouchY = (touch1.clientY + touch2.clientY) / 2;

            // Get zoom factor from distance change
            const zoomFactor = currentTouchDistance / lastTouchDistance;

            // Calculate new scale with limits
            const newScale = Math.max(1, Math.min(5, scale * zoomFactor));

            // Check if we're going to scale 1 (fully zoomed out)
            const wasZoomedIn = scale > 1;
            const willBeZoomedOut = newScale === 1;

            if (newScale !== scale) {
                // If going from zoomed in to fully zoomed out, just reset
                if (wasZoomedIn && willBeZoomedOut) {
                    resetZoom();
                } else {
                    // Get image dimensions and position
                    const imgRect = img.getBoundingClientRect();

                    // Calculate pinch center relative to the image's current transformed state
                    const imgCenterX = imgRect.left + imgRect.width / 2;
                    const imgCenterY = imgRect.top + imgRect.height / 2;

                    // Pinch position relative to image center, adjusted for current scale
                    const relativeX = (lastPinchCenter.x - imgCenterX) / scale;
                    const relativeY = (lastPinchCenter.y - imgCenterY) / scale;

                    // Calculate new position to maintain pinch center relative to image
                    const newTranslateX = translateX - (relativeX * (newScale - scale));
                    const newTranslateY = translateY - (relativeY * (newScale - scale));

                    // Update scale and position
                    scale = newScale;
                    translateX = newTranslateX;
                    translateY = newTranslateY;

                    // Adjust position for pinch movement
                    translateX += (currentTouchX - lastTouchX);
                    translateY += (currentTouchY - lastTouchY);

                    applyTransform();
                }
            }

            // Update last touch values
            lastTouchDistance = currentTouchDistance;
            lastTouchX = currentTouchX;
            lastTouchY = currentTouchY;
            lastPinchCenter = {
                x: currentTouchX,
                y: currentTouchY
            };
        }
    };
    container.addEventListener('touchmove', touchmoveHandler);

    const touchendHandler = function (e) {
        if (e.touches.length === 0) {
            // Handle the end of touch like a "tap" if it wasn't a drag
            if (isDragging && scale > 1) {
                isDragging = false;

                // If touch moved beyond threshold, set timeout before allowing taps
                if (touchMoved) {
                    dragTimeout = setTimeout(() => {
                        touchMoved = false;
                        dragTimeout = null;
                    }, DRAG_TIMEOUT_DELAY);
                } else if (!dragTimeout) {
                    // This was a tap, not a drag - we can handle it like a click
                    // Only if not in a timeout from a previous drag
                    const lastTouch = e.changedTouches[0];
                    zoomAtPoint(lastTouch.clientX, lastTouch.clientY, true);
                }
            }

            isDragging = false;
        } else if (e.touches.length === 1) {
            // If we go from 2 touches to 1, update start position for panning
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialTranslateX = translateX;
            initialTranslateY = translateY;
            isDragging = scale > 1;

            // Reset touch tracking for the new single touch
            touchMoved = false;
            touchDragDistance = 0;
        }
    };
    container.addEventListener('touchend', touchendHandler);

    // Keyboard controls
    const keydownHandler = function (e) {
        if (scale > 1) {
            const moveAmount = 30;
            switch (e.key) {
                case 'ArrowUp':
                    translateY += moveAmount;
                    applyTransform();
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    translateY -= moveAmount;
                    applyTransform();
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    translateX += moveAmount;
                    applyTransform();
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    translateX -= moveAmount;
                    applyTransform();
                    e.preventDefault();
                    break;
                case '+':
                case '=':
                    scale = Math.min(5, scale * 1.1);
                    applyTransform();
                    e.preventDefault();
                    break;
                case '-':
                    const newScale = Math.max(1, scale * 0.9);
                    if (newScale === 1 && scale > 1) {
                        resetZoom();
                    } else {
                        scale = newScale;
                        applyTransform();
                    }
                    e.preventDefault();
                    break;
                case '0':
                case 'r':
                    resetZoom();
                    e.preventDefault();
                    break;
            }
        }
    };
    document.addEventListener('keydown', keydownHandler);

    // Set initial cursor
    container.style.cursor = 'zoom-in';

    // Add cleanup function to remove event listeners
    const fullscreenViewer = document.getElementById('fullscreenViewer');
    if (fullscreenViewer) {
        const cleanup = function () {
            container.removeEventListener('wheel', wheelHandler);
            container.removeEventListener('click', clickHandler);
            container.removeEventListener('contextmenu', contextMenuHandler);
            container.removeEventListener('mousedown', mousedownHandler);
            document.removeEventListener('mousemove', mousemoveHandler);
            document.removeEventListener('mouseup', mouseupHandler);
            container.removeEventListener('dblclick', dblclickHandler);
            container.removeEventListener('touchstart', touchstartHandler);
            container.removeEventListener('touchmove', touchmoveHandler);
            container.removeEventListener('touchend', touchendHandler);
            document.removeEventListener('keydown', keydownHandler);
            fullscreenViewer.removeEventListener('cleanup-image-zoom', cleanup);

            // Clear any pending timeouts
            if (dragTimeout) {
                clearTimeout(dragTimeout);
                dragTimeout = null;
            }
        };

        fullscreenViewer.addEventListener('cleanup-image-zoom', cleanup);
    }
}

/**
 * Reset image zoom and pan to original state
 */
function resetImageZoomPan(img) {
    if (window.resetImageZoomPan) {
        window.resetImageZoomPan();
    } else if (img) {
        img.style.transform = 'translate(0px, 0px) scale(1)';
    }
}

/**
 * Close fullscreen image view
 */
function closeFullscreenImage() {
    const fullscreenViewer = document.getElementById('fullscreenViewer');
    if (!fullscreenViewer) return;

    // Reset fullscreen state
    fullscreenState = {
        images: [],
        currentIndex: 0,
        hasNavigation: false,
        context: ''
    };

    // Trigger event to clean up zoom handlers
    const cleanupEvent = new CustomEvent('cleanup-image-zoom');
    fullscreenViewer.dispatchEvent(cleanupEvent);

    fullscreenViewer.classList.remove('active');
    document.body.style.overflow = '';

    // Clean up event listener
    document.removeEventListener('keydown', handleFullscreenKeydown);
}

/**
 * Close gallery page
 */
function closeGalleryPage() {
    const galleryPage = document.getElementById('galleryPage');
    if (galleryPage) {
        galleryPage.classList.remove('active');
        galleryPage.style.visibility = 'hidden';
        galleryPage.style.opacity = '0';
        galleryPage.style.transform = 'translateY(100%)';
        document.body.style.overflow = '';
    }
}

/**
 * Close progress page
 */
function closeProgressPage() {
    const progressPage = document.getElementById('progressPage');
    if (progressPage) {
        progressPage.classList.remove('active');
        progressPage.style.visibility = 'hidden';
        progressPage.style.opacity = '0';
        progressPage.style.transform = 'translateY(100%)';
        document.body.style.overflow = '';
    }
}

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('workModal');
    if (modal) {
        // Immediately remove the visible class to prevent reopening issues
        modal.classList.remove('visible');

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'translateY(-50px)';
            modalContent.style.opacity = '0';
        }

        // Reset modal visibility and styles
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';

        // Re-enable page scrolling
        document.body.style.overflow = '';

        // Clean up any event listeners on gallery and progress buttons
        const galleryBtn = modal.querySelector('.view-gallery-btn');
        const progressBtn = modal.querySelector('.view-progress-btn');

        if (galleryBtn) {
            const newGalleryBtn = galleryBtn.cloneNode(true);
            galleryBtn.parentNode.replaceChild(newGalleryBtn, galleryBtn);
        }

        if (progressBtn) {
            const newProgressBtn = progressBtn.cloneNode(true);
            progressBtn.parentNode.replaceChild(newProgressBtn, progressBtn);
        }
    }
}

/**
 * Initialize navigation
 */
function initNavigation() {
    const navToggle = document.getElementById('navToggleBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;

    if (navToggle && navMenu) {
        console.log('Setting up navigation toggle');
        const mainToggleHandler = () => {
            console.log('Nav toggle clicked from main.js');
            // Ensure the toggle animation works by explicitly checking current state
            if (navMenu.classList.contains('show')) {
                navMenu.classList.remove('show');
                navToggle.classList.remove('active');
            } else {
                navMenu.classList.add('show');
                navToggle.classList.add('active');
            }
        };

        // Remove any existing handlers first to prevent conflicts
        navToggle.removeEventListener('click', mainToggleHandler);
        navToggle.addEventListener('click', mainToggleHandler);

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (!targetSection) return;

                // Close mobile menu first
                navToggle.classList.remove('active');
                navMenu.classList.remove('show');
                // Log to verify this code is executing
                console.log('Mobile menu closed by link click');

                // Close any open gallery or progress pages
                const galleryPage = document.getElementById('galleryPage');
                const progressPage = document.getElementById('progressPage');

                if (galleryPage && galleryPage.classList.contains('active')) {
                    closeGalleryPage();
                }
                if (progressPage && progressPage.classList.contains('active')) {
                    closeProgressPage();
                }

                // Update URL hash without triggering a page reload
                history.pushState(null, null, `#${targetId}`);
                console.log('Navigation: changing to section', targetId);

                // Update active section
                sections.forEach(section => {
                    if (section.id === targetId) {
                        section.classList.add('active');

                        // Set header data attribute for section styling
                        const header = document.querySelector('header');
                        if (header) {
                            header.setAttribute('data-section', targetId);
                            console.log('Setting header data-section to', targetId);
                        }

                        // Initialize Unity when landing section becomes active
                        if (section.id === 'landing' && window.unityLoader && !window.unityInitialized) {
                            window.unityInitialized = true;
                            window.currentSection = '#landing';
                            // Enable Unity keyboard input for landing section
                            console.log('Landing section activated, enabling Unity keyboard input');
                            enableUnityKeyboardInput();
                        } else if (section.id === 'landing') {
                            // Enable Unity keyboard input when returning to landing section
                            console.log('Landing section activated, enabling Unity keyboard input');
                            enableUnityKeyboardInput();
                        } else {
                            // Disable Unity keyboard input for other sections
                            console.log(`${section.id} section activated, disabling Unity keyboard input`);
                            disableUnityKeyboardInput();
                        }

                        // Set current section in window for other scripts to access
                        window.currentSection = '#' + section.id;

                        // Dispatch section changed event
                        const event = new CustomEvent('sectionChanged', {
                            detail: '#' + section.id
                        });
                        window.dispatchEvent(event);

                        // Reset scroll position for all sections with a slight delay
                        const sectionContent = section.querySelector('.section-content');
                        if (sectionContent) {
                            // Force scroll to top with slight delay to ensure section is visible
                            setTimeout(() => {
                                sectionContent.scrollTop = 0;
                                // Ensure header has the correct styling
                                header.classList.remove('scrolled');
                            }, 100);
                        }
                    } else {
                        section.classList.remove('active');
                    }
                });

                // Update active link
                navLinks.forEach(navLink => {
                    navLink.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
    }

    // Add scroll listener to each section to handle header overlap
    sections.forEach(section => {
        const sectionContent = section.querySelector('.section-content');
        if (sectionContent) {
            sectionContent.addEventListener('scroll', () => {
                if (sectionContent.scrollTop > 10) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });

            // Ensure content doesn't go behind header by setting initial top padding
            sectionContent.style.paddingTop = `${headerHeight + 20}px`;
        }
    });

    // Listen for browser back/forward buttons to ensure proper section navigation
    window.addEventListener('popstate', () => {
        checkUrlHashAndNavigate();
        // Also apply header styles after navigation
        setTimeout(applyHeaderStyles, 50);
    });

    // Check if landing section is initially active, if so initialize Unity
    const landingSection = document.getElementById('landing');
    if (landingSection && landingSection.classList.contains('active')) {
        window.currentSection = '#landing';
    }
}

/**
 * Register service worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Use correct path relative to the root
            const swPath = './service-worker.js';

            // Check if service worker already exists
            const existingRegistration = await navigator.serviceWorker.getRegistration();

            if (existingRegistration) {
                console.log('Existing ServiceWorker found, updating if needed');

                // Update the registration if needed
                if (existingRegistration.active) {
                    existingRegistration.update()
                        .then(() => console.log('ServiceWorker updated'))
                        .catch(err => console.error('ServiceWorker update failed:', err));
                }

                return;
            }

            // Register new service worker
            const registration = await navigator.serviceWorker.register(swPath);
            console.log('ServiceWorker registration successful with scope:', registration.scope);
        } catch (err) {
            console.error('ServiceWorker registration failed:', err);
            // Don't show error to user, just log it
        }
    });
}

/**
 * Update footer year to current year
 */
function updateFooterYear() {
    const yearElements = document.querySelectorAll('.current-year, #current-year');
    const currentYear = new Date().getFullYear();

    yearElements.forEach(el => {
        if (el) el.textContent = currentYear;
    });
}

// Create and initialize dedicated gallery page
function loadGalleryPage(workId) {
    // Implement gallery page loading logic here
    console.log('Loading gallery for', workId);
}

// Create and initialize dedicated progress page
function loadProgressPage(workId) {
    // Implement progress page loading logic here
    console.log('Loading progress for', workId);
}

/**
 * Apply direct styles to header when on landing section
 * This is a failsafe in case CSS selectors aren't working properly
 */
function applyHeaderStyles() {
    const currentSection = window.currentSection || '';
    const header = document.querySelector('header');

    if (header) {
        if (currentSection === '#landing') {
            console.log('Applying direct landing header styles via JS');
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.1)';
            header.style.backdropFilter = 'blur(8px)';
            header.style.WebkitBackdropFilter = 'blur(8px)';
            header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
            header.style.boxShadow = 'none';
        } else {
            // Only clear these specific styles, don't reset everything
            header.style.backgroundColor = '';
            header.style.backdropFilter = '';
            header.style.WebkitBackdropFilter = '';
            header.style.borderBottom = '';
            header.style.boxShadow = '';
        }
    }
}

// Call this whenever the section changes
window.addEventListener('sectionChanged', function (e) {
    console.log('Section changed event fired:', e.detail);
    applyHeaderStyles();
});

// Also apply on DOM content loaded
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(applyHeaderStyles, 100); // Short delay to ensure everything is initialized
});

// Video Streaming Manager
class VideoStreamingManager {
    constructor() {
        this.videoChunks = new Map();
        this.loadingVideos = new Set();
        this.mediaSourceBuffers = new Map();
        this.initialChunkSize = 1024 * 1024; // 1MB initial chunk
    }

    async initializeVideo(video) {
        if (!video || this.loadingVideos.has(video)) return;

        this.loadingVideos.add(video);
        video.classList.add('loading');

        try {
            // Create MediaSource
            const mediaSource = new MediaSource();
            video.src = URL.createObjectURL(mediaSource);

            mediaSource.addEventListener('sourceopen', async () => {
                const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
                const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                this.mediaSourceBuffers.set(video, sourceBuffer);

                // Start loading initial chunks
                await this.loadInitialChunks(video);
            });
        } catch (error) {
            console.error('Error initializing video:', error);
            window.handleMediaError(video);
        }
    }

    async loadInitialChunks(video) {
        const sourceBuffer = this.mediaSourceBuffers.get(video);
        if (!sourceBuffer) return;

        try {
            // Get video URL from source element
            const sourceElement = video.querySelector('source');
            if (!sourceElement) return;

            const videoUrl = sourceElement.src;

            // Fetch initial chunk
            const response = await fetch(videoUrl, {
                headers: {
                    'Range': `bytes=0-${this.initialChunkSize}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch video chunk');

            const chunk = await response.arrayBuffer();

            // Append chunk to source buffer
            sourceBuffer.addEventListener('updateend', () => {
                video.classList.remove('loading');
                if (isElementInViewport(video)) {
                    playVideo(video);
                }
            }, { once: true });

            sourceBuffer.appendBuffer(chunk);
            sourceBuffer.flush();

            // Start background loading of remaining chunks
            this.loadRemainingChunks(video, videoUrl);
        } catch (error) {
            console.error('Error loading initial chunks:', error);
            window.handleMediaError(video);
        }
    }

    async loadRemainingChunks(video, videoUrl) {
        const sourceBuffer = this.mediaSourceBuffers.get(video);
        if (!sourceBuffer) return;

        try {
            // Get video duration and size
            const response = await fetch(videoUrl, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            if (!contentLength) return;

            let currentPosition = this.initialChunkSize;
            const chunkSize = 1024 * 1024; // 1MB chunks

            while (currentPosition < contentLength) {
                const endPosition = Math.min(currentPosition + chunkSize, contentLength);
                const response = await fetch(videoUrl, {
                    headers: {
                        'Range': `bytes=${currentPosition}-${endPosition}`
                    }
                });

                if (!response.ok) break;

                const chunk = await response.arrayBuffer();
                sourceBuffer.appendBuffer(chunk);
                sourceBuffer.flush();

                currentPosition = endPosition + 1;
            }
        } catch (error) {
            console.error('Error loading remaining chunks:', error);
        }
    }
}

// Initialize video streaming manager
const videoStreamingManager = new VideoStreamingManager();

// Update initializeVideo function to use streaming manager
function initializeVideo(video) {
    if (!video) return;

    // Initialize streaming
    videoStreamingManager.initializeVideo(video);

    // Add intersection observer
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    playVideo(video);
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(video);
    }

    // Handle errors
    video.addEventListener('error', () => {
        window.handleMediaError(video);
    });
} 
