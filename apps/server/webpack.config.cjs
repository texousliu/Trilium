const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join, default: path } = require('path');

const outputDir = join(__dirname, 'dist');

function buildFilesToCopy() {
  const files = [];

  files.push({
    from: "../client/dist",
    to: join(outputDir, "public")
  });

  const nodePaths = [
    "@excalidraw/excalidraw/dist/prod/fonts/",
    "katex/dist",
    "boxicons/css",
    "boxicons/fonts",
    "jquery/dist",
    "jquery-hotkeys",
    "autocomplete.js/dist",
    "normalize.css/normalize.css",
    "jquery.fancytree/dist",
    "codemirror/lib",
    "codemirror/addon",
    "codemirror/mode",
    "codemirror/keymap",
    "@highlightjs/cdn-assets",

    // Required as they are native dependencies and cannot be well bundled.
    "better-sqlite3",
    "bindings",
    "file-uri-to-path"
  ];

  for (const nodePath of nodePaths) {
    files.push({
      from: join("..", "..", "node_modules", nodePath),
      to: join(outputDir, "node_modules", nodePath)
    })
  }

  return files;
}

module.exports = {
  output: {
    path: outputDir
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      externalDependencies: [
        "electron/main",
        "@electron/remote/main",
        "electron",
        "@electron/remote",        
        "better-sqlite3"
      ]
    }),
    new CopyPlugin({
      patterns: buildFilesToCopy()
    })
  ]
};
