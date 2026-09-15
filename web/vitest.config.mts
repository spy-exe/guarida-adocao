import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./testes/preparo.ts"],
    include: ["testes/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["app/**/*.tsx", "components/**/*.tsx", "lib/**/*.ts"],
      // a plaquinha e WebGL puro, que o jsdom nao tem; a fisica dela mora em lib/pendulo.ts e tem teste proprio
      exclude: ["components/PlaquinhaDeColeira.tsx"],
      reporter: ["text-summary", "text", "json-summary"],
      thresholds: { statements: 98, branches: 98, functions: 98, lines: 98 }
    }
  }
});
