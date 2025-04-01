import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";


// Go to https://eslint.style/rules/default/${rule_without_prefix} to check the rule details
const stylisticRules = {
    "@stylistic/indent": [ "error", 4 ],
    "@stylistic/quotes": [ "error", "double", { avoidEscape: true, allowTemplateLiterals: "always" } ],
    "@stylistic/semi": [ "error", "always" ],
    "@stylistic/quote-props": [ "error", "consistent-as-needed" ],
    "@stylistic/max-len": [ "error", { code: 200 } ],
    "@stylistic/comma-dangle": [ "error", "never" ],
    "@stylistic/linebreak-style": [ "error", "unix" ],
    "@stylistic/array-bracket-spacing": [ "error", "always" ],
    "@stylistic/object-curly-spacing": [ "error", "always" ],
    "@stylistic/padded-blocks": [ "error", { classes: "always" } ]
};

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    // consider using rules below, once we have a full TS codebase and can be more strict
    // tseslint.configs.strictTypeChecked,
    // tseslint.configs.stylisticTypeChecked,
    // tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            // add rule overrides here
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_"
                }
            ],
            ...stylisticRules
        }
    },
    {
        ignores: [
            "build/*",
            "dist/*",
            "docs/*",
            "libraries/*",
            "src/public/app-dist/*",
            "src/public/app/doc_notes/*"
        ]
    }
);
