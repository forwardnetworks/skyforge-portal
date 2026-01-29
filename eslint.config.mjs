import js from "@eslint/js";

export default [
	{ ignores: ["dist/**", "postcss.config.cjs", "tailwind.config.js"] },
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
		},
	},
];
