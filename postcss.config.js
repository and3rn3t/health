export default async () => {
  // Ensure Tailwind uses JS implementation (no native oxide binding)
  process.env.TAILWIND_DISABLE_OXIDE = process.env.TAILWIND_DISABLE_OXIDE || '1';

  const tailwindPlugin = (await import('@tailwindcss/postcss')).default;
  const autoprefixer = (await import('autoprefixer')).default;

  return {
    plugins: [tailwindPlugin(), autoprefixer],
  };
};
