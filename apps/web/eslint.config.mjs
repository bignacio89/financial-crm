import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript","prettier"),
  {
    rules: {
      // ════════════════════════════════════════════
      // TypeScript - Warnings instead of errors
      // ════════════════════════════════════════════
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      
      // ════════════════════════════════════════════
      // React Hooks - Critical rules
      // ════════════════════════════════════════════
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // ════════════════════════════════════════════
      // Code Quality
      // ════════════════════════════════════════════
      "prefer-const": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "warn",
      
      // ════════════════════════════════════════════
      // Next.js specific
      // ════════════════════════════════════════════
      "@next/next/no-html-link-for-pages": "warn",
      
      // ════════════════════════════════════════════
      // Import organization (optional but nice)
      // ════════════════════════════════════════════
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];

export default eslintConfig;
