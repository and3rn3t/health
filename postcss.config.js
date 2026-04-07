// PostCSS configuration
// TODO: Migrate to Tailwind v4 — currently using tailwindcss v3 via PostCSS with v4
// packages (@tailwindcss/postcss, @tailwindcss/oxide, @tailwindcss/vite) installed but unused.
// Migration steps:
//   1. Replace this plugin with '@tailwindcss/postcss': {}
//   2. Update src/main.css: @tailwind directives → @import "tailwindcss"
//   3. Convert tailwind.config.js to CSS @theme directives (or use @config)
//   4. Remove tailwindcss v3 + autoprefixer from devDependencies
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
