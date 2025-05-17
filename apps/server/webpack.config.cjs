const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join } = require('path');

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
    "jquery/dist",
    "jquery-hotkeys",
    "jquery.fancytree/dist",

    // Required as they are native dependencies and cannot be well bundled.
    "better-sqlite3",
    "bindings",
    "file-uri-to-path"
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
  module: {
    rules: [
      {
        test: /\.css$/i,
        type: "asset/source"
      }
    ]
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
      additionalEntryPoints: [
        "./src/docker_healthcheck.ts"
      ],
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
