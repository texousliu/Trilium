import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    // consider using rules below, once we have a full TS codebase and can be more strict
    // tseslint.configs.strictTypeChecked,
    // tseslint.configs.stylisticTypeChecked,
    //tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        rules: {
            // add rule overrides here
        }
    },
    {
        ignores: ["build/*", "dist/*", "src/public/app-dist/*"]
    }
);
