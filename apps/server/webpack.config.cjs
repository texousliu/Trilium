const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join, default: path } = require('path');

const outputDir = join(__dirname, 'dist');

function buildFilesToCopy() {
  const files = [{
    from: "node_modules/better-sqlite3/build/Release",
    to: join(outputDir, "Release")
  }];

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
    "normalize.css",
    "jquery.fancytree/dist",
    "codemirror/lib",
    "codemirror/addon",
    "codemirror/mode",
    "codemirror/keymap",
    "@highlightjs/cdn-assets"
  ];

  for (const nodePath of nodePaths) {
    files.push({
      from: join("node_modules", nodePath),
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
    }),
    new CopyPlugin({
      patterns: buildFilesToCopy()
    })
  ]
};
