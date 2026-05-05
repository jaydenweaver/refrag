import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve "refrag" to the library source so the example mirrors
      // what an end-user importing from npm would experience.
      refrag: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
});
