import { join } from "path";
import { defineConfig } from "vite";

export default defineConfig(() => ({
    root: join(__dirname, "src")
}));
