/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Restrictive CSP (spec non-functional: security). Injected for builds only,
// because the dev server needs inline scripts for HMR.
const csp: Plugin = {
  name: "inject-csp",
  apply: "build",
  transformIndexHtml() {
    return [
      {
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content:
            "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'",
        },
        injectTo: "head-prepend",
      },
    ];
  },
};

export default defineConfig({
  plugins: [react(), csp],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", include: ["src/**"], exclude: ["src/test/**", "src/main.tsx"] },
  },
});
