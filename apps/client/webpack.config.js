
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  devServer: {
    port: 4200,
    client: {
        overlay: {
            errors: true,
            warnings: false,
            runtimeErrors: true
        }
    }
  },
  plugins: [
    new NxAppWebpackPlugin({
      tsConfig: './tsconfig.app.json',
      compiler: 'swc',
      main: "./src/index.ts",
      additionalEntryPoints: [
        {
            entryName: "desktop",
            entryPath: "./src/desktop.ts"
        },
        {
            entryName: "mobile",
            entryPath: "./src/mobile.ts"
        },
        {
            entryName: "login",
            entryPath: "./src/login.ts"
        },
        {
            entryName: "setup",
            entryPath: "./src/setup.ts"
        },
        {
            entryName: "share",
            entryPath: "./src/share.ts"
        },
        {
            // TriliumNextTODO: integrate set_password into setup entry point/view
            entryName: "set_password",
            entryPath: "./src/set_password.ts"
        }
      ],
      externalDependencies: [
        "electron"
      ],
      baseHref: '/',
      assets: [
        "./src/assets",
        "./src/stylesheets",
        "./src/libraries",
      ],
      styles: [],
      stylePreprocessorOptions: {
        sassOptions: {
            quietDeps: true
        }
      },
      outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
      optimization: process.env['NODE_ENV'] === 'production',
    })
  ],
  resolve: {
    fallback: {
        path: false,
        fs: false,
        util: false
    }
  }
};

