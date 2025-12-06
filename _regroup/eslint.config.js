import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
    {
        plugins: {
            "simple-import-sort": simpleImportSort
        }
    },
    {
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
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error"
        }
    }
);
