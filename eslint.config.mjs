import js from "@eslint/js";

export default [
  { ignores: ["dist/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    }
  }
];
