import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/server/connectors/rss-atom.ts",
      "src/app/api/internal/sources/route.ts",
      "src/app/api/v1/news/feedback/route.ts",
    ],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores([".next/**", "node_modules/**"]),
]);
