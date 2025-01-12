import { defineConfig } from "vitest/config";
import { configDefaults, coverageConfigDefaults } from "vitest/config";

const customExcludes = ["build/**", "e2e/**", "integration-tests/**", "tests-examples/**"];

export default defineConfig({
    test: {
        exclude: [...configDefaults.exclude, ...customExcludes],
        coverage: {
            exclude: [...coverageConfigDefaults.exclude, ...customExcludes]
        }
    }
});
