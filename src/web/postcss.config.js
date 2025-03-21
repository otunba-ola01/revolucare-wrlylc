/**
 * PostCSS Configuration
 * 
 * This file configures the CSS processing pipeline for the Revolucare application,
 * integrating Tailwind CSS and optimizing CSS for production.
 */

module.exports = {
  plugins: {
    // Process Tailwind CSS directives and generate utility classes
    // tailwindcss v3.3.2+
    tailwindcss: {},
    
    // Add vendor prefixes to CSS rules for browser compatibility
    // autoprefixer v10.4.14+
    autoprefixer: {
      flexbox: 'no-2009',  // Use modern flexbox implementations
      grid: true,          // Enable Grid Layout prefixing
    },
    
    // Only include these plugins in production mode
    ...(process.env.NODE_ENV === 'production'
      ? {
          // Convert modern CSS features to compatible CSS
          // postcss-preset-env v8.0.0+
          'postcss-preset-env': {
            stage: 3,           // Use stage 3 features (relatively stable)
            features: {
              'custom-properties': false,  // Disable custom properties processing
            },
          },
          
          // Minify CSS for production builds
          cssnano: {
            preset: [
              'default',
              {
                discardComments: {
                  removeAll: true,  // Remove all comments in production
                },
              },
            ],
          },
        }
      : {}),
  },
};