import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

export default defineConfig({
  testDir: "./e2e",
  use: {
    ctPort: 3100,
    ctViteConfig: {
      plugins: [react()],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // Enable the HTML-in-Canvas origin trial.
          // Without this flag texElementImage2D will not exist and the
          // component will fall back to its unavailable-API error path.
          args: ["--enable-experimental-web-platform-features"],
        },
      },
    },
  ],
});
