import { defineConfig } from "vitest/config";

// Runs the assignment tests as TypeScript directly; .mts because package.json is CommonJS.
export default defineConfig({
  test: {
    environment: "node",
    include: ["assignment/**/*.test.ts"],
    setupFiles: [
      "./assignment/vitest.setup.ts",
      "./assignment/support/seedFaker.ts",
    ],
  },
});
