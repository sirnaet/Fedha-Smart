// sirnaet/fedhasmart/fedhasmart-f7cb430ca7f0dda8da986661e48fd176c83e2263/vite.config.ts
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // CRITICAL FIX: Forces Vite to pre-bundle these CJS dependencies for reliable import.
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
}));