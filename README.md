# Unity Portfolio Website

A modern, responsive portfolio website featuring Unity WebGL integration with optimized performance and graceful loading.

## Features

- **Unity WebGL Integration**
  - Graceful loading with particle animation
  - Automatic orientation handling
  - Platform detection and optimization
  - Error handling and retry mechanism
  - Performance monitoring

- **Portfolio Management**
  - Dynamic work categories
  - Lazy loading of images
  - Responsive grid layout
  - Modal view for detailed information

- **Performance Optimizations**
  - Efficient resource loading
  - Memory management for Unity
  - Lazy loading of sections
  - Optimized animations
  - Service worker for offline support

- **Accessibility**
  - ARIA landmarks
  - Keyboard navigation
  - Screen reader support
  - High contrast mode
  - Reduced motion support

- **Internationalization**
  - Multi-language support
  - RTL language support
  - Dynamic content translation
  - Locale-specific formatting

## Project Structure

```
Portfolio-Website/
├── assets/
│   ├── icons/          # Website icons
│   └── images/         # Static images
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── core/           # Core functionality
│   │   └── app.js      # Application orchestrator
│   ├── services/       # Feature services
│   │   ├── unityService.js
│   │   ├── workService.js
│   │   ├── contactService.js
│   │   ├── navigationService.js
│   │   ├── animationService.js
│   │   ├── themeService.js
│   │   ├── mediaService.js
│   │   ├── analyticsService.js
│   │   ├── cacheService.js
│   │   ├── accessibilityService.js
│   │   └── i18nService.js
│   └── utils/          # Utility functions
├── data/
│   └── works/          # Portfolio data
├── locales/            # Translation files
├── index.html          # Main HTML file
├── manifest.webmanifest # Web app manifest
└── service-worker.js   # Service worker
```

## Unity Integration

The Unity WebGL build is integrated with the following optimizations:

1. **Loading Strategy**
   - Particle animation during loading
   - Progress tracking
   - Graceful error handling
   - Automatic retry mechanism

2. **Performance Management**
   - Memory cleanup when switching sections
   - Canvas size optimization
   - Platform-specific settings
   - Resource preloading

3. **Orientation Handling**
   - Automatic orientation detection
   - Smooth transitions
   - Responsive layout adjustments
   - Mobile optimization

## Setup Instructions

1. **Unity Build Setup**
   - Build your Unity project for WebGL
   - Place build files in the appropriate directory
   - Update build configuration in `unityService.js`

2. **Portfolio Content**
   - Add work items to `data/works/`
   - Update images in `assets/images/`
   - Configure categories and details

3. **Localization**
   - Add translation files to `locales/`
   - Update language selector in HTML
   - Configure RTL support if needed

4. **Development**
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev

   # Build for production
   npm run build
   ```

## Performance Considerations

1. **Unity Optimization**
   - Use appropriate build settings
   - Implement memory management
   - Handle orientation changes
   - Monitor frame rate

2. **Resource Loading**
   - Lazy load images
   - Preload critical assets
   - Implement caching
   - Use service worker

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

1.0.0 