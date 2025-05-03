
const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const { join } = require('path');

module.exports = composePlugins(
  withNx({
    tsConfig: join(__dirname, './tsconfig.app.json'),
    compiler: "tsc",
    main: join(__dirname, "./src/index.ts"),
    additionalEntryPoints: [
      {
          entryName: "desktop",
          entryPath: join(__dirname, "./src/desktop.ts")
      },
      {
          entryName: "mobile",
          entryPath: join(__dirname, "./src/mobile.ts")
      },
      {
          entryName: "login",
          entryPath: join(__dirname, "./src/login.ts")
      },
      {
          entryName: "setup",
          entryPath: join(__dirname, "./src/setup.ts")
      },
      {
          entryName: "share",
          entryPath: join(__dirname, "./src/share.ts")
      },
      {
          // TriliumNextTODO: integrate set_password into setup entry point/view
          entryName: "set_password",
          entryPath: join(__dirname, "./src/set_password.ts")
      }
    ],
    externalDependencies: [
      "electron"
    ],
    baseHref: '/',
    assets: [
      join(__dirname, "./src/assets"),
      join(__dirname, "./src/stylesheets"),
      join(__dirname, "./src/libraries"),
      join(__dirname, "./src/fonts"),
      join(__dirname, "./src/translations")
    ],
    outputHashing: false,
    optimization: process.env['NODE_ENV'] === 'production'
  }),
  withWeb({
    styles: [],
    stylePreprocessorOptions: {
      sassOptions: {
          quietDeps: true
      }
    },
  }),
  (config) => {
    config.output = {
      path: join(__dirname, 'dist')
    };

    config.devServer = {
      port: 4200,
      client: {
          overlay: {
              errors: true,
              warnings: false,
              runtimeErrors: true
          }
      }
    }

    config.resolve.fallback = {
      path: false,
      fs: false,
      util: false
    };

    return config;
  }
);