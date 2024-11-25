const path = require("path");

module.exports = {
    mode: "production",
    entry: "./main.js",
    output: {
        library: "MERMAID_ELK",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        libraryExport: "default"
    }
}