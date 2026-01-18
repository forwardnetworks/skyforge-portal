import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  build: {
    // Build directly into the Skyforge Encore service so it can embed + serve the SPA
    // without a separate nginx/frontend container.
    outDir: "../server/skyforge/frontend_dist",
    emptyOutDir: true,
    // Avoid clobbering Coder's `/assets/*` paths routed by Traefik.
    // The Helm chart routes `/assets/skyforge/*` to `skyforge-server` (Encore).
    assetsDir: "assets/skyforge",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tanstack")) return "tanstack";
          if (id.includes("react")) return "react";
          if (id.includes("framer-motion") || id.includes("motion")) return "motion";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("class-variance-authority") || id.includes("clsx") || id.includes("tailwind-merge"))
            return "ui-utils";
          return "vendor";
        }
      }
    }
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
