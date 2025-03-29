# Unity Portfolio Website

A modern, responsive portfolio website featuring Unity WebGL integration with optimized performance, offline support, and enhanced security features.

## Features

- **Unity WebGL Integration**
  - Graceful loading with particle animation
  - Automatic orientation handling
  - Platform detection and optimization
  - Error handling and retry mechanism
  - Performance monitoring
  - Memory management for Unity instances

- **Portfolio Management**
  - Dynamic work categories
  - Lazy loading of images
  - Responsive grid layout
  - Modal view for detailed information
  - Work details page with rich content

- **Performance Optimizations**
  - Efficient resource loading with preloading
  - Memory management for Unity
  - Lazy loading of sections
  - Optimized animations
  - Service worker for offline support
  - DNS prefetching and preconnect
  - Resource caching strategies

- **Security Features**
  - Content Security Policy (CSP)
  - Strict referrer policy
  - X-Content-Type-Options
  - Secure headers configuration
  - HTTPS enforcement

- **Progressive Web App (PWA)**
  - Service worker implementation
  - Offline functionality
  - App manifest
  - Installable on devices
  - Cache management
  - Background sync

- **Accessibility**
  - ARIA landmarks
  - Keyboard navigation
  - Screen reader support
  - High contrast mode
  - Reduced motion support

## Project Structure

```
Portfolio-Website/
├── assets/
│   ├── icons/          # Website icons and favicons
│   └── images/         # Static images and placeholders
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── particle-loader.js  # Loading animation
│   ├── unity-loader.js     # Unity integration
│   └── main.js            # Main application logic
├── data/               # Portfolio content data
├── Build/             # Unity WebGL build files
├── index.html         # Main HTML file
├── work-details.html  # Work item details page
├── manifest.webmanifest # Web app manifest
├── service-worker.js  # Service worker for offline support
├── offline.html       # Offline fallback page
└── nginx.conf        # Nginx configuration
```

## Unity Integration

The Unity WebGL build is integrated with the following optimizations:

1. **Loading Strategy**
   - Particle animation during loading
   - Progress tracking
   - Graceful error handling
   - Automatic retry mechanism
   - Preloading of critical assets

2. **Performance Management**
   - Memory cleanup when switching sections
   - Canvas size optimization
   - Platform-specific settings
   - Resource preloading
   - Cache management for Unity files

3. **Orientation Handling**
   - Automatic orientation detection
   - Smooth transitions
   - Responsive layout adjustments
   - Mobile optimization

## Setup Instructions

1. **Unity Build Setup**
   - Build your Unity project for WebGL
   - Place build files in the `Build/` directory
   - Update Unity template settings in `index.html`

2. **Portfolio Content**
   - Add work items to `data/` directory
   - Update images in `assets/images/`
   - Configure categories and details

3. **Development**
   ```bash
   # Using a local server (e.g., Python)
   python -m http.server 8000

   # Or using Node.js http-server
   npx http-server
   ```

## Performance Considerations

1. **Unity Optimization**
   - Use appropriate build settings
   - Implement memory management
   - Handle orientation changes
   - Monitor frame rate
   - Cache Unity files appropriately

2. **Resource Loading**
   - Lazy load images
   - Preload critical assets
   - Implement caching
   - Use service worker
   - DNS prefetching

3. **Memory Management**
   - Clean up resources
   - Handle page visibility
   - Monitor memory usage
   - Implement garbage collection

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS 12+, Android 5+)

## Security Considerations

1. **Content Security**
   - Strict CSP implementation
   - Secure headers
   - HTTPS enforcement
   - XSS protection

2. **Resource Protection**
   - Cache control headers
   - Referrer policy
   - Content type options
   - Secure resource loading

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Echen Deligani

## Version

1.1.0 