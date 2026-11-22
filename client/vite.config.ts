import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // relative assets so the build works on GitHub Pages project sites
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
