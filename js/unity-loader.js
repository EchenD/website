/**
 * Unity Loader and Manager for Portfolio
 * Version: 1.0.0
 * Author: Echen Deligani
 * Last Updated: 2025-03-17
 */

class UnityPortfolioLoader {
    constructor() {
        this.CONFIG = {
            buildUrl: "./Build/", // Root directory for Unity files
            buildFiles: {
                loader: "./Build/Echen.loader.js",
                framework: "./Build/Echen.framework.js.unityweb",
                data: "./Build/Echen.data.unityweb",
                wasm: "./Build/Echen.wasm.unityweb"
            },
            maxRetries: 3,
            retryDelay: 2000,
            timeoutDuration: 30000,
            particleConfig: {
                particleSize: 3,
                particleColor: '#FF2400',
                glowColor: 'rgba(255, 36, 0, 0.5)',
                trailColor: 'rgba(255, 36, 0, 0.3)',
                trailLength: 12,
                speed: 1.2,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                particleCount: 50,
                minSpeed: 0.5,
                maxSpeed: 2
            },
            mobileParticleConfig: {
                particleSize: 6,
                particleColor: '#FF2400',
                glowColor: 'rgba(255, 36, 0, 0.7)',
                trailColor: 'rgba(255, 36, 0, 0.5)',
                trailLength: 15,
                speed: 1.5,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                particleCount: 50,
                minSpeed: 0.8,
                maxSpeed: 2
            }
        };

        this.elements = {
            container: document.querySelector("#portfolio-container"),
            canvas: document.querySelector("#portfolio-canvas"),
            loadingBar: document.querySelector("#portfolio-loading-bar"),
            warning: document.querySelector("#portfolio-warning"),
            pageLoading: document.querySelector("#page-loading"),
            loadingAnimation: document.querySelector("#loading-animation")
        };

        this.state = {
            isLoading: false,
            loadingProgress: 0,
            retryCount: 0,
            isInitialized: false,
            unityScriptLoaded: false
        };

        this.particleLoader = null;
        this.resizeTimeout = null;

        // Bind methods
        this.init = this.init.bind(this);
        this.handleError = this.handleError.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.showWarning = this.showWarning.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Add event listener cleanup tracking
        this.eventListeners = new Set();

        // Add resize listener
        window.addEventListener('resize', this.debounce(this.handleResize, 250));
    }

    /**
       * Loads the Unity loader script dynamically
       * @returns {Promise} Resolves when script is loaded
       */
    async loadUnityScript() {
        if (this.state.unityScriptLoaded) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const loaderPath = this.CONFIG.buildFiles.loader;

            console.log('Loading Unity script from:', loaderPath);

            script.src = loaderPath;
            script.async = true;

            script.onload = () => {
                console.log('Unity loader script loaded successfully');
                this.state.unityScriptLoaded = true;
                resolve();
            };

            script.onerror = (error) => {
                console.error('Failed to load Unity loader script:', error);
                reject(new Error(`Failed to load Unity loader from ${loaderPath}`));
            };

            document.body.appendChild(script);
        });
    }

    async init() {
        if (this.state.isLoading) return;
        this.state.isLoading = true;

        try {
            console.log('Starting Unity initialization...');

            // Fix for potential scrollbar issues
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';

            // Check canvas context
            if (!this.elements.canvas) {
                throw new Error('Canvas element not found');
            }

            // Reset any potentially problematic canvas styling
            const canvas = this.elements.canvas;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.right = '0';
            canvas.style.bottom = '0';
            canvas.style.margin = '0';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';

            // Set initial canvas size
            this.setCanvasSize();

            // Initialize loading animation
            if (this.elements.loadingAnimation) {
                try {
                    // Ensure the loading animation canvas has proper dimensions
                    const loadingBar = this.elements.loadingBar;
                    if (loadingBar) {
                        // Make sure loading bar is visible
                        loadingBar.style.display = 'block';

                        // Set explicit dimensions for loading animation canvas
                        const loadingCanvas = this.elements.loadingAnimation;
                        loadingCanvas.style.width = '100%';
                        loadingCanvas.style.height = '60px';

                        // Force a reflow to ensure the dimensions are applied
                        void loadingCanvas.offsetWidth;

                        console.log('Loading animation canvas dimensions set:',
                            loadingCanvas.offsetWidth, loadingCanvas.offsetHeight);
                    }

                    // Choose config based on device type
                    const isMobile = this.detectIsMobileDevice();
                    console.log('Device detected as:', isMobile ? 'mobile' : 'desktop');
                    const configToUse = isMobile ? this.CONFIG.mobileParticleConfig : this.CONFIG.particleConfig;

                    this.particleLoader = new ParticleLoader(
                        this.elements.loadingAnimation,
                        configToUse
                    );
                    this.particleLoader.start();
                } catch (error) {
                    console.warn('Failed to initialize particle loader:', error);
                }
            }

            this.hidePageLoading();
            this.updateProgress(0.01);

            // Load Unity script
            await this.loadUnityScript();
            this.updateProgress(0.02);

            if (typeof createUnityInstance !== 'function') {
                throw new Error('Unity loader function not available');
            }

            // Configure Unity instance
            const unityConfig = {
                dataUrl: this.CONFIG.buildFiles.data,
                frameworkUrl: this.CONFIG.buildFiles.framework,
                codeUrl: this.CONFIG.buildFiles.wasm,
                streamingAssetsUrl: "StreamingAssets",
                companyName: "EchenDeligani",
                productName: "Portfolio",
                productVersion: "1.0.0",
                webglContextAttributes: {
                    preserveDrawingBuffer: true,
                    powerPreference: "high-performance",
                    antialias: true,
                    alpha: false,
                    depth: true,
                    stencil: true,
                    desynchronized: true
                },
                devicePixelRatio: 1,
                showBanner: false,
                doNotCaptureKeyboard: true,
                keyboardListeningElement: document.getElementById('portfolio-container'),
                onProgress: (progress) => {
                    const scaledProgress = 0.2 + (progress * 0.8);
                    this.updateProgress(scaledProgress);
                }
            };

            console.log('Creating Unity instance with config:', unityConfig);

            // Create Unity instance with progress tracking
            const unityInstance = await createUnityInstance(
                this.elements.canvas,
                unityConfig,
                (progress) => {
                    const scaledProgress = 0.2 + (progress * 0.8);
                    this.updateProgress(scaledProgress);
                }
            );

            // Store instance and update state
            window.unityInstance = unityInstance;
            this.state.isInitialized = true;

            // Cleanup loading elements
            this.hideLoadingElements();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize platform settings
            this.initializePlatformSettings();

            // Perform initial resize to ensure proper canvas position
            this.handleResize();
            this.handleOrientationChange();

            // Initialize audio context after user interaction
            document.addEventListener('click', () => {
                if (unityInstance) {
                    const audioContext = unityInstance.Module.webAudioContext;
                    if (audioContext && audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                }
            }, { once: true });

        } catch (error) {
            console.error('Unity initialization error:', error);
            await this.handleError(error);
        } finally {
            this.state.isLoading = false;
        }
    }

    updateProgress(progress) {
        this.state.loadingProgress = progress;

        if (this.particleLoader) {
            this.particleLoader.setProgress(progress);
        }

        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            const percentage = Math.round(progress * 100);
            loadingText.textContent = `Loading... ${percentage}%`;
        }
    }

    showWarning(message, type = 'warning', duration = 5000) {
        if (window.unityInstance) {
            console.log('Suppressing warning because Unity is already loaded:', message);
            return;
        }

        if (window.showError) {
            window.showError(message, duration);
        } else {
            const warning = document.createElement('div');
            warning.className = `unity-warning unity-warning-${type}`;
            warning.textContent = message;

            const styles = {
                error: 'background: #ff5555; color: white;',
                warning: 'background: #ffdd55; color: black;',
                info: 'background: #5555ff; color: white;'
            };
            warning.style = `padding: 10px; margin: 5px; border-radius: 4px; ${styles[type]}`;

            this.elements.warning.appendChild(warning);
            this.elements.warning.style.display = 'block';

            if (duration > 0 && type !== 'error') {
                setTimeout(() => {
                    warning.remove();
                    if (this.elements.warning.children.length === 0) {
                        this.elements.warning.style.display = 'none';
                    }
                }, duration);
            }
        }
    }

    async handleError(error) {
        if (this.state.retryCount < this.CONFIG.maxRetries) {
            this.state.retryCount++;
            this.showWarning(
                `Loading failed, retrying... (${this.state.retryCount}/${this.CONFIG.maxRetries})`,
                'warning'
            );

            this.state.unityScriptLoaded = false;
            await new Promise(resolve => setTimeout(resolve, this.CONFIG.retryDelay));
            await this.init();
        } else {
            this.showWarning(
                'Failed to load Unity content. Please check your internet connection and refresh the page.',
                'error',
                0
            );
            this.hideLoadingElements();
        }
    }

    setCanvasSize() {
        if (this.elements.container && this.elements.canvas) {
            const container = this.elements.container;
            const canvas = this.elements.canvas;

            // Reset container styles
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.right = '0';
            container.style.bottom = '0';
            container.style.margin = '0';
            container.style.padding = '0';
            container.style.overflow = 'hidden';

            // Get viewport dimensions
            const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
            const viewportHeight = document.documentElement.clientHeight || window.innerHeight;

            console.log(`Viewport dimensions: ${viewportWidth}x${viewportHeight}`);

            // Set canvas dimensions to match viewport
            canvas.style.width = viewportWidth + 'px';
            canvas.style.height = viewportHeight + 'px';
            canvas.width = viewportWidth;
            canvas.height = viewportHeight;
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.margin = '0';
            canvas.style.padding = '0';

            console.log(`Canvas set to: ${canvas.width}x${canvas.height}`);

            // Notify Unity of resize if available
            if (window.unityInstance) {
                this.safelySendMessage('GameController', 'OnWindowResize');
            }
        }
    }

    hideLoadingElements() {
        // For mobile devices, let's ensure loading is displayed for at least 2 seconds
        // so users can see the animation even on fast connections
        const isMobile = this.detectIsMobileDevice();

        if (isMobile && this.state.loadingProgress < 0.5) {
            console.log('On mobile device, ensuring loading animation is shown for a minimum time');
            // Artificially delay hiding the loading elements on mobile
            setTimeout(() => {
                this.actuallyHideLoadingElements();
            }, 2000);
        } else {
            this.actuallyHideLoadingElements();
        }
    }

    actuallyHideLoadingElements() {
        console.log('Actually hiding loading elements now');

        // First stop the particle loader animation
        if (this.particleLoader) {
            this.particleLoader.stop();
            // Make sure we set this to null so it can be properly garbage collected
            this.particleLoader = null;
        }

        // Then hide the loading bar with a fade transition
        if (this.elements.loadingBar) {
            // Use opacity for smoother transition
            this.elements.loadingBar.style.transition = 'opacity 0.5s ease';
            this.elements.loadingBar.style.opacity = '0';

            // Actually remove it from display after the transition
            setTimeout(() => {
                this.elements.loadingBar.style.display = 'none';
                console.log('Loading bar hidden after transition');
            }, 600);
        }

        this.hidePageLoading();
    }

    hidePageLoading() {
        if (this.elements.pageLoading) {
            this.elements.pageLoading.style.opacity = '0';
            setTimeout(() => {
                this.elements.pageLoading.style.display = 'none';
            }, 500);
        }
    }

    setupEventListeners() {
        console.log('Setting up Unity loader event listeners');

        // Clean up existing event listeners to prevent duplicates
        if (this.eventListeners.size > 0) {
            console.log('Cleaning up existing event listeners');
            this.cleanupEventListeners();
        }

        // Setup resize handler with debounce
        window.addEventListener('resize', this.debounce(() => {
            this.handleOrientationChange();
            this.setCanvasSize();
        }, 250));

        // Setup orientation change handler
        window.addEventListener('orientationchange', () => {
            console.log('Orientation change event fired');
            this.handleOrientationChange();
        });

        // Handle initial orientation on load
        window.addEventListener('load', () => {
            console.log('Page loaded, initializing orientation');
            this.handleOrientationChange();
            this.setCanvasSize();

            // Initial resize of Unity canvas if on portfolio section
            if (window.currentSection === '#portfolio' && window.unityInstance) {
                this.resizeUnityCanvas();
            }
        });

        // Listen for Unity load complete
        document.addEventListener('unityLoadComplete', () => {
            console.log('Unity load complete, setting canvas size');
            this.handleOrientationChange();
            this.resizeUnityCanvas();
        });

        // Setup mobile navigation toggle
        const navToggle = document.getElementById('navToggleBtn');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            const toggleHandler = () => {
                console.log('Unity loader toggle handler called');
                if (navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                    navToggle.classList.remove('active');
                } else {
                    navMenu.classList.add('show');
                    navToggle.classList.add('active');
                }
            };

            this.eventListeners.add({
                element: navToggle,
                type: 'click',
                handler: toggleHandler
            });
            navToggle.removeEventListener('click', toggleHandler);
            navToggle.addEventListener('click', toggleHandler);

            // Close mobile menu when clicking a nav link
            const navLinks = document.querySelectorAll('nav a');
            navLinks.forEach(link => {
                const linkHandler = () => {
                    if (navMenu.classList.contains('show')) {
                        console.log('Closing mobile menu from link click');
                        navToggle.classList.remove('active');
                        navMenu.classList.remove('show');
                    }
                };

                this.eventListeners.add({
                    element: link,
                    type: 'click',
                    handler: linkHandler
                });
                link.addEventListener('click', linkHandler);
            });
        }
    }

    cleanupEventListeners() {
        for (const listener of this.eventListeners) {
            console.log(`Removing event listener: ${listener.type} from element`, listener.element);
            listener.element.removeEventListener(listener.type, listener.handler);
        }
        this.eventListeners.clear();
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    handleOrientationChange() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const isSmallScreen = window.innerWidth <= 480;

        // Update body class for orientation and screen size
        document.body.classList.toggle('portrait', isPortrait);
        document.body.classList.toggle('landscape', !isPortrait);
        document.body.classList.toggle('small-screen', isSmallScreen);

        // Resize the canvas if we're on portfolio section
        if (window.currentSection === '#portfolio' && window.unityInstance) {
            this.resizeUnityCanvas();
        }

        console.log(`Orientation changed: ${isPortrait ? 'Portrait' : 'Landscape'}, Small Screen: ${isSmallScreen}`);

        // Update Unity orientation if available
        if (window.unityInstance) {
            const orientation = isPortrait ? 'Portrait' : 'Landscape';
            this.safelySendMessage('GameController', 'SetOrientation', orientation);
        }
    }

    resizeUnityCanvas() {
        if (!window.unityInstance) {
            console.log('Unity instance not available yet, skipping resize');
            return;
        }

        const container = document.getElementById('portfolio-container');
        const canvas = document.getElementById('portfolio-canvas');

        if (!container || !canvas) {
            console.log('Container or canvas not found, skipping resize');
            return;
        }

        const isPortrait = window.innerHeight > window.innerWidth;
        const isSmallScreen = window.innerWidth <= 480;

        if (isSmallScreen) {
            // Full viewport for small screens
            container.style.width = '100vw';
            container.style.height = '100vh';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        } else if (isPortrait) {
            // Portrait mode sizing
            const availableHeight = window.innerHeight - document.querySelector('header').offsetHeight;
            const width = Math.min(window.innerWidth, availableHeight * 1.5);
            const height = width / 1.5;

            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        } else {
            // Landscape mode sizing
            const width = Math.min(window.innerWidth * 0.9, window.innerHeight * 1.5);
            const height = width / 1.5;

            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }

        console.log(`Canvas resized: ${container.style.width} x ${container.style.height}`);

        // Update Unity orientation if available
        try {
            const orientation = isPortrait ? 'Portrait' : 'Landscape';
            window.unityInstance.SendMessage('GameController', 'SetOrientation', orientation);
            console.log('Sent SetOrientation message to Unity with value: ' + orientation);
        } catch (e) {
            console.log('Error sending orientation to Unity: ' + e.message);
        }
    }

    initializePlatformSettings() {
        if (!window.unityInstance) {
            console.log('Unity instance not available yet, skipping platform settings');
            return;
        }

        try {
            const platform = this.detectPlatform();
            const orientation = this.detectOrientation();

            console.log(`Initializing Unity with platform: ${platform}, orientation: ${orientation}`);

            this.safelySendMessage('GameController', 'SetPlatform', platform);
            this.safelySendMessage('GameController', 'SetOrientation', orientation);
        } catch (error) {
            console.error('Failed to initialize platform settings:', error.message);
        }
    }

    detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'Mobile';
        if (/android/i.test(userAgent)) return 'Mobile';
        if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
        return 'PC';
    }

    detectIsMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        return isMobile || isSmallScreen;
    }

    detectOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        return isPortrait ? 'Portrait' : 'Landscape';
    }

    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            this.setCanvasSize();
            if (window.unityInstance) {
                this.safelySendMessage('GameController', 'OnWindowResize');
            }
        }, 250);
    }

    dispose() {
        // Cleanup event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners.clear();

        // Cleanup particle loader
        if (this.particleLoader) {
            this.particleLoader.stop();
            this.particleLoader = null;
        }

        // Cleanup Unity instance
        if (window.unityInstance) {
            window.unityInstance.Quit().then(() => {
                window.unityInstance = null;
                this.state.isInitialized = false;
            });
        }

        // Clear timeouts
        clearTimeout(this.resizeTimeout);

        // Reset state
        this.state = {
            isLoading: false,
            loadingProgress: 0,
            retryCount: 0,
            isInitialized: false,
            unityScriptLoaded: false
        };

        // Clear elements
        this.elements = {
            container: null,
            canvas: null,
            loadingBar: null,
            warning: null,
            pageLoading: null,
            loadingAnimation: null
        };

        // Remove resize listener
        window.removeEventListener('resize', this.handleResize);
    }

    initializeUnity(containerID, canvasID, loaderUrl, config) {
        console.log('Initializing Unity with container:', containerID);
        const container = document.getElementById(containerID);
        const canvas = document.getElementById(canvasID);

        if (!container || !canvas) {
            console.error('Container or canvas element not found:', containerID, canvasID);
            this.handleError(new Error('Unity container or canvas not found'));
            return;
        }

        // Set initial canvas size
        this.setCanvasSize();

        // Store original loader URL
        const originalLoaderUrl = loaderUrl;

        // Create a variable to track if we've shown errors
        let errorShown = false;
        let loadAttempts = 0;
        const maxAttempts = 3;

        // Try loading the script with a custom error handler
        const tryLoadScript = (currentUrl) => {
            loadAttempts++;
            console.log(`Attempt ${loadAttempts} loading Unity from: ${currentUrl}`);

            // Create script element
            const script = document.createElement("script");
            script.src = currentUrl;

            // Handle loader errors
            script.onerror = () => {
                console.warn(`Failed to load Unity WebGL loader script (attempt ${loadAttempts}):`, currentUrl);

                // Try alternative paths before showing errors
                if (loadAttempts === 1) {
                    // Try with 'Echen' instead of 'webapp'
                    const altPath = currentUrl.replace('webapp.loader.js', 'Echen.loader.js');
                    console.log('Trying alternative path:', altPath);
                    tryLoadScript(altPath);
                } else if (loadAttempts === 2) {
                    // Try direct path to Build folder
                    const altPath = './Build/Echen.loader.js';
                    console.log('Trying direct path:', altPath);
                    tryLoadScript(altPath);
                } else {
                    // Only show error after all attempts have failed
                    if (!errorShown) {
                        errorShown = true;
                        console.error('All Unity loader script attempts failed');
                        // Show a user-friendly error message
                        this.showWarning('3D interactive portfolio could not be loaded. Displaying static version instead.', 'error', 8000);
                        // Hide loading elements
                        this.hideLoadingElements();
                        // Show fallback content
                        this.showFallbackContent(container);
                        // Dispatch error event
                        document.dispatchEvent(new Event('unityLoadError'));
                    }
                }
            };

            script.onload = () => {
                console.log('Unity loader script loaded successfully!');

                // Check if the createUnityInstance function exists
                if (typeof createUnityInstance !== 'function') {
                    console.error('Unity WebGL API not found after loading script');
                    if (!errorShown) {
                        errorShown = true;
                        this.showWarning('3D portfolio could not be initialized. Displaying static version.', 'error');
                        this.showFallbackContent(container);
                    }
                    return;
                }

                // Try to create the Unity instance
                createUnityInstance(canvas, config).then((instance) => {
                    console.log('Unity instance created successfully');
                    window.unityInstance = instance;

                    // Clear any timeout
                    if (this.unityLoadTimeout) {
                        clearTimeout(this.unityLoadTimeout);
                        this.unityLoadTimeout = null;
                    }

                    // Set canvas size again now that Unity is loaded
                    this.handleOrientationChange();
                    this.resizeUnityCanvas();

                    // Hide any loading indicators
                    this.hideLoadingElements();

                    // Dispatch event that Unity is loaded
                    document.dispatchEvent(new Event('unityLoadComplete'));
                }).catch((error) => {
                    console.error('Unity instance creation error:', error);
                    if (!errorShown) {
                        errorShown = true;
                        this.showWarning('Failed to load the 3D portfolio. Showing static version.', 'error');
                        this.handleError(error);
                        this.showFallbackContent(container);
                    }
                });
            };

            // Append the script to the document
            document.body.appendChild(script);
        };

        // Start the loading process
        tryLoadScript(loaderUrl);

        // Set a timeout to detect if Unity takes too long to load
        this.unityLoadTimeout = setTimeout(() => {
            // If unityInstance still doesn't exist after timeout
            if (!window.unityInstance && !errorShown) {
                errorShown = true;
                console.warn('Unity loading timed out');
                this.showWarning('3D portfolio is taking longer than expected to load. Showing static version.', 'warning');
                this.showFallbackContent(container);
            }
        }, 15000); // 15 seconds timeout
    }

    /**
     * Show fallback content when Unity fails to load
     * @param {HTMLElement} container - The Unity container element
     */
    showFallbackContent(container) {
        // Clear the Unity load timeout if it exists
        if (this.unityLoadTimeout) {
            clearTimeout(this.unityLoadTimeout);
            this.unityLoadTimeout = null;
        }

        // Hide any loading elements
        this.hideLoadingElements();

        // Clear the container
        if (container) {
            // Keep the container but make it less prominent
            container.style.height = '300px';
            container.style.background = 'var(--primary-color)';

            // Add a message to the container
            const fallbackContent = document.createElement('div');
            fallbackContent.className = 'unity-fallback';
            fallbackContent.innerHTML = `
                <div class="fallback-message">
                    <h3>Interactive 3D Portfolio</h3>
                    <p>The interactive 3D version of this portfolio could not be loaded.</p>
                    <p>You can still explore all projects and content using the navigation menu.</p>
                    <button id="retry-unity-load" class="fallback-button">Retry Loading 3D View</button>
                </div>
            `;
            container.appendChild(fallbackContent);

            // Add retry button functionality
            const retryButton = container.querySelector('#retry-unity-load');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    // Remove fallback content
                    container.removeChild(fallbackContent);
                    // Show loading again
                    const loadingElement = document.getElementById('portfolio-loading-bar');
                    if (loadingElement) loadingElement.style.display = 'block';
                    // Attempt to reinitialize Unity
                    this.init();
                });
            }
        }

        // Allow scrolling on the landing section since Unity won't be taking over
        const landingContent = document.querySelector('#landing .section-content');
        if (landingContent) {
            landingContent.style.overflowY = 'auto';
        }
    }

    /**
     * Check if Unity GameObject exists with the specified component method
     * @param {string} gameObject - GameObject name
     * @param {string} methodName - Method name to check
     * @returns {boolean} - Whether the GameObject and method exist
     */
    checkUnityFunction(gameObject, methodName) {
        if (!window.unityInstance) return false;

        try {
            // This is just a check if the method exists, doesn't actually call it
            // Send a test value to see if an error is thrown
            const testValue = "CHECK_ONLY";
            window.unityInstance.SendMessage(gameObject, methodName, testValue);
            return true;
        } catch (e) {
            console.log(`Unity method ${gameObject}.${methodName} is not available: ${e.message}`);
            return false;
        }
    }

    /**
     * Safely send a message to Unity checking if the function exists first
     * @param {string} gameObject - GameObject name
     * @param {string} methodName - Method name
     * @param {string} parameter - Parameter to send
     */
    safelySendMessage(gameObject, methodName, parameter = "") {
        if (!window.unityInstance) return;

        try {
            window.unityInstance.SendMessage(gameObject, methodName, parameter);
            console.log(`Sent ${methodName} message to Unity with value: ${parameter}`);
        } catch (e) {
            console.log(`Error sending ${methodName} to Unity: ${e.message}`);
        }
    }
}

// Create and initialize the loader
const unityLoader = new UnityPortfolioLoader();

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => unityLoader.init());
} else {
    unityLoader.init();
}

// Export for external use
window.unityLoader = unityLoader;
