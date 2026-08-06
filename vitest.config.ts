import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // No test files exist until the loader lands; without this the runner exits 1.
    passWithNoTests: true,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
