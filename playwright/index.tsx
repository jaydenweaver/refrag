import { beforeMount, afterMount } from "@playwright/experimental-ct-react/hooks";

beforeMount(async ({ App }) => {
  // Global setup before each component mounts.
  // Extend here if you need providers (theme, context, etc.).
});

afterMount(async ({ component }) => {
  // Global teardown after each component mounts.
});
