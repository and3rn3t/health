export default async () => {
  // Ensure Tailwind uses JS implementation (no native oxide binding)
  process.env.TAILWIND_DISABLE_OXIDE = '1';

  try {
    const tailwindPlugin = (await import('@tailwindcss/postcss')).default;
    const autoprefixer = (await import('autoprefixer')).default;

    return {
      plugins: [tailwindPlugin(), autoprefixer],
    };
  } catch (error) {
    console.warn(
      'PostCSS plugin loading failed, using minimal config:',
      error.message
    );
    // Fallback to basic configuration without potentially problematic plugins
    return {
      plugins: [],
    };
  }
};
