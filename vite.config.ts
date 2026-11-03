import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Everything in public/ (writeups, classic.html, fonts, style.css, script.js) is copied to dist/ untouched,
// so the existing static writeups keep working next to the React home page.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: { outDir: "dist" },
  server: { allowedHosts: true },
});
