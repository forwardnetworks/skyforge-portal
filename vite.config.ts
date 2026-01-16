import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  build: {
    // Avoid clobbering Coder's `/assets/*` paths routed by Traefik.
    // The Helm chart routes `/assets/skyforge/*` to `skyforge-portal`.
    assetsDir: "assets/skyforge"
  },
  plugins: [TanStackRouterVite(), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:8085", changeOrigin: true },
      "/status": { target: "http://localhost:8085", changeOrigin: true },
      "/auth": { target: "http://localhost:8085", changeOrigin: true },
      "/data": { target: "http://localhost:8085", changeOrigin: true }
    }
  }
});
