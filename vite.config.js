import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8787";

// During `npm run dev`, requests to /api/* are forwarded to the
// small Express backend in /server (see server/index.js), so the
// frontend never needs to know the backend's real port and the
// LLM API key never has to touch the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
