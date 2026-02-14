import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.url,
});

export default [
  ...compat.extends("next/core-web-vitals"),
];
