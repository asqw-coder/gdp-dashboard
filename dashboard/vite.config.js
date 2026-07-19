import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:          "dist",
    sourcemap:       false,
    chunkSizeWarningLimit: 1000,
  },
  define: {
    // Inject env vars at build time — set in Cloudflare Pages dashboard
    "__WORKER_URL__": JSON.stringify(process.env.VITE_WORKER_URL || ""),
    "__API_KEY__":    JSON.stringify(process.env.VITE_API_KEY    || ""),
  },
});
