const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join } = require('path');

const outputDir = join(__dirname, 'dist');

module.exports = {
  output: {
    path: outputDir,
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/electron-main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      externalDependencies: [
        "electron/main",
        "electron",
        "@electron/remote"
      ],
      assets: [

      ]
    }),
    new CopyPlugin({
        patterns: [
            {
                from: "node_modules/better-sqlite3/build/Release",
                to: join(outputDir, "Release")
            }
        ]
    })
  ],
};
