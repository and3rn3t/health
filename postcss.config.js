// PostCSS configuration
// Note: The warning "A PostCSS plugin did not pass the `from` option to `postcss.parse`"
// is a known harmless warning when using PostCSS plugins with Vite. It doesn't affect
// functionality - Vite handles the 'from' option internally. This can be safely ignored.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
