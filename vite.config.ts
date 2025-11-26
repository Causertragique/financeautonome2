import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./src", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      external: [
        // Empêcher l'importation de code serveur dans le build client
        /^\.\/server/,
        /^server\//,
        "stripe",
      ],
    },
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      buffer: "buffer",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      // Import createServer seulement lors de la configuration du serveur (pas au build)
      // Utiliser un import dynamique avec une condition pour éviter le bundling
      if (process.env.NODE_ENV !== "production") {
        try {
          const { createServer } = await import("./server/index.js");
          const app = createServer();
          // Add Express app as middleware to Vite dev server
          server.middlewares.use(app);
        } catch (error) {
          console.warn("Impossible de charger le serveur Express:", error);
        }
      }
    },
  };
}
