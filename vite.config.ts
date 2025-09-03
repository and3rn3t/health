import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "path";

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
});
