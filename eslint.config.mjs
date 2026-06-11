import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // docs/ holds locked reference inputs (design mockups, the bundled design
    // system) — never app source, never linted. Built output + generated
    // files are excluded too. next-env.d.ts is committed but not edited/linted.
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "docs/**"],
  },
];

export default eslintConfig;
