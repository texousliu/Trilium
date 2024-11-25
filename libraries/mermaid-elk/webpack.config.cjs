const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    entry: "./main.js",
    output: {
        library: "MERMAID_ELK",
        filename: "elk.min.js",
        path: path.resolve(__dirname),
        libraryTarget: "umd",
        libraryExport: "default"
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ]
}