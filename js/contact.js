/**
 * Contact Form Handler
 * Version: 1.0.0
 * Author: Echen Deligani
 */

// Wait for EmailJS to be loaded
function waitForEmailJS() {
    return new Promise((resolve, reject) => {
        if (window.emailjs) {
            resolve();
        } else {
            // Try to load EmailJS if not already loaded
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load EmailJS'));
            document.head.appendChild(script);
        }
    });
}

// Initialize the contact form
async function initContactForm() {
    try {
        // Wait for EmailJS to be available
        await waitForEmailJS();

        // Initialize EmailJS with your public key
        emailjs.init("9iM2SW42NvYy0UkfA"); // Your public key

        const form = document.getElementById('contact-form');
        if (!form) return;

        const submitBtn = form.querySelector('.submit-btn');
        const successMessage = form.querySelector('.success-message');
        const errorMessages = form.querySelectorAll('.error-message');

        // Reset form state
        function resetForm() {
            form.reset();
            successMessage.style.display = 'none';
            errorMessages.forEach(msg => msg.textContent = '');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }

        // Show error message
        function showError(field, message) {
            const errorElement = field.nextElementSibling;
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.textContent = message;
            }
        }

        // Show success message
        function showSuccess() {
            successMessage.style.display = 'block';
            // Reset form after 3 seconds
            setTimeout(resetForm, 3000);
        }

        // Validate email format
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // Validate form fields
        function validateForm() {
            let isValid = true;
            const name = form.querySelector('#name');
            const email = form.querySelector('#email');
            const message = form.querySelector('#message');

            // Reset previous errors
            errorMessages.forEach(msg => msg.textContent = '');

            // Validate name
            if (!name.value.trim()) {
                showError(name, 'Name is required');
                isValid = false;
            }

            // Validate email
            if (!email.value.trim()) {
                showError(email, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showError(email, 'Please enter a valid email address');
                isValid = false;
            }

            // Validate message
            if (!message.value.trim()) {
                showError(message, 'Message is required');
                isValid = false;
            }

            return isValid;
        }

        // Handle form submission
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!validateForm()) {
                return;
            }

            // Disable submit button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                // Prepare template parameters
                const templateParams = {
                    from_name: form.querySelector('#name').value,
                    from_email: form.querySelector('#email').value,
                    message: form.querySelector('#message').value,
                };

                console.log('Attempting to send email with params:', templateParams);

                // Send email using EmailJS
                const response = await emailjs.send(
                    'service_8uwnngl', // Your EmailJS service ID
                    'template_2f1rqnx', // Your EmailJS template ID
                    templateParams
                );

                console.log('EmailJS response:', response);

                if (response.status === 200) {
                    console.log('Email sent successfully');
                    showSuccess();
                } else {
                    throw new Error(`EmailJS returned status ${response.status}`);
                }

            } catch (error) {
                console.error('Failed to send email:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    text: error.text
                });

                // Show more specific error message
                let errorMessage = 'Failed to send message. Please try again.';
                if (error.text) {
                    try {
                        const errorJson = JSON.parse(error.text);
                        errorMessage = errorJson.message || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error text:', e);
                    }
                }

                showError(form.querySelector('#message'), errorMessage);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });

        // Ensure the form is properly positioned in the DOM
        form.style.position = 'relative';
        form.style.zIndex = '1000';
        form.style.pointerEvents = 'auto';

        // Create a wrapper div to handle Unity canvas interaction
        const formWrapper = document.createElement('div');
        formWrapper.style.position = 'relative';
        formWrapper.style.zIndex = '1000';
        formWrapper.style.pointerEvents = 'auto';
        form.parentNode.insertBefore(formWrapper, form);
        formWrapper.appendChild(form);

        // Handle Unity canvas interaction
        const unityCanvas = document.getElementById('portfolio-canvas');
        if (unityCanvas) {
            // Function to disable Unity canvas interaction
            const disableUnityCanvas = () => {
                unityCanvas.style.pointerEvents = 'none';
                unityCanvas.style.zIndex = '1';
                formWrapper.style.zIndex = '1000';
            };

            // Function to enable Unity canvas interaction
            const enableUnityCanvas = () => {
                unityCanvas.style.pointerEvents = 'auto';
                unityCanvas.style.zIndex = '1000';
                formWrapper.style.zIndex = '1';
            };

            // Handle form focus events
            form.addEventListener('focusin', (e) => {
                e.stopPropagation();
                disableUnityCanvas();
            }, true);

            form.addEventListener('focusout', (e) => {
                e.stopPropagation();
                enableUnityCanvas();
            }, true);

            // Handle form click events
            form.addEventListener('click', (e) => {
                e.stopPropagation();
                disableUnityCanvas();
            }, true);

            // Handle form input events
            form.querySelectorAll('input, textarea').forEach(field => {
                field.addEventListener('click', (e) => {
                    e.stopPropagation();
                    disableUnityCanvas();
                }, true);

                field.addEventListener('focus', (e) => {
                    e.stopPropagation();
                    disableUnityCanvas();
                }, true);

                field.addEventListener('blur', (e) => {
                    e.stopPropagation();
                    enableUnityCanvas();
                }, true);
            });
        }

        // Add input event listeners for real-time validation
        form.querySelectorAll('input, textarea').forEach(field => {
            // Clear error message on input
            field.addEventListener('input', function (e) {
                e.stopPropagation();
                if (this.value.trim()) {
                    const errorElement = this.nextElementSibling;
                    if (errorElement && errorElement.classList.contains('error-message')) {
                        errorElement.textContent = '';
                    }
                }
            }, true);
        });

    } catch (error) {
        console.error('Failed to initialize contact form:', error);
        // Show error message to user
        const form = document.getElementById('contact-form');
        if (form) {
            const errorMessage = form.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = 'Failed to initialize contact form. Please try again later.';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initContactForm); 
