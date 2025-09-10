export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Production CSS optimization
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: 'default',
      },
    }),
  },
};