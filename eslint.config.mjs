// @ts-check

import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    ".cache",
    "tmp",
    "**/dist",
    "**/out-tsc",
    "apps/edit-docs/demo/*",
    "docs/*",
    "apps/web-clipper/lib/*",
    // TODO: check if we want to format packages here as well - for now skipping it
    "packages/*",
  ]),
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
  }
);
