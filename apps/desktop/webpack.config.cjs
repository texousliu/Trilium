const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { join } = require('path');

const outputDir = join(__dirname, 'dist');

module.exports = {
  output: {
    path: outputDir
  },
  target: [ "node" ],
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
        "@electron/remote",        
        "better-sqlite3"
      ],
      assets: [

      ]
    }),
    new CopyPlugin({
        patterns: [            
            {
                from: "../client/dist",
                to: join(outputDir, "public")
            },
            {
                from: "../server/dist/node_modules",
                to: join(outputDir, "node_modules")
            },
            {
                from: "../server/dist/assets",
                to: join(outputDir, "assets")
            },
            {
              from: "node_modules/better-sqlite3",
              to: join(outputDir, "node_modules/better-sqlite3")
            },
        ]
    })
  ]
};
