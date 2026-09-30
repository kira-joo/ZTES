import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/** ESLint 9 flat config. `prettier` last so formatting rules never fight the formatter. */
export default [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", "data/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      "react-hooks/exhaustive-deps": "error",
      // `@Type()` needs reflect-metadata at decoration time; the facade loads it first.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "class-transformer",
              message: "Import from src/server/core/dto/transform instead (it loads reflect-metadata first).",
            },
            {
              name: "framer-motion",
              message: "Use motion/react.",
            },
          ],
        },
      ],
      // Toolkit fields render through Controller, which never reads setValueAs.
      "no-restricted-syntax": [
        "error",
        {
          selector: 'Property[key.name="rules"] Property[key.name="setValueAs"]',
          message: "setValueAs in a toolkit `rules` object is ignored. Coerce at the submit boundary.",
        },
      ],
    },
  },
  {
    files: ["src/server/core/dto/transform.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["src/server/**/*.schema.ts", "src/server/**/dto/**/*.ts"],
    rules: { "@typescript-eslint/no-extraneous-class": "off" },
  },
];
