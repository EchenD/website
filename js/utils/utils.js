/**
 * Utility functions for the portfolio website
 * Version: 1.0.0
 * Author: EchenD
 */

// DOM Utilities
export const getElement = (selector) => document.querySelector(selector);
export const getElements = (selector) => document.querySelectorAll(selector);

// String Utilities
export const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Performance Utilities
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Validation Utilities
export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Platform Detection
export const detectPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'iOS';
    }

    if (/android/i.test(userAgent)) {
        return 'Android';
    }

    if (/Mobi|Android/i.test(userAgent)) {
        return 'Mobile';
    }

    return 'Desktop';
};

// Orientation Detection
export const detectOrientation = () => {
    if (window.screen && window.screen.orientation) {
        const type = window.screen.orientation.type;
        return type.includes('portrait') ? 'Portrait' : 'Landscape';
    }

    if (window.orientation !== undefined) {
        return Math.abs(window.orientation) === 90 ? 'Landscape' : 'Portrait';
    }

    return window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape';
};

// Image Loading
export const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Notification System
export const showNotification = (message, type = 'info', duration = 5000) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
};

// Storage Utilities
export const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Event Utilities
export const addEventListeners = (element, events, handler) => {
    events.forEach(event => {
        element.addEventListener(event, handler);
    });
};

export const removeEventListeners = (element, events, handler) => {
    events.forEach(event => {
        element.removeEventListener(event, handler);
    });
}; 
