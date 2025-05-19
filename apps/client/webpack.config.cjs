
const { composePlugins, withNx, withWeb } = require('@nx/webpack');
const { join } = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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

    const assets = [ "assets", "stylesheets", "libraries", "fonts", "translations" ]      
    config.plugins.push(new CopyPlugin({
      patterns: assets.map((asset) => ({
        from: join(__dirname, "src", asset),
        to: asset
      }))
    }));

    inlineCss(config);
    inlineSvg(config);
    externalJson(config);

    return config;
  }
);

function inlineSvg(config) {
  if (!config.module?.rules) {
    return;
  }

  // Alter Nx's asset rule to avoid inlining SVG if they have ?raw prepended.
  const existingRule = config.module.rules.find((r) => r.test.toString() === /\.svg$/.toString());
  existingRule.resourceQuery = { not: [/raw/] };
  
  // Add a rule for prepending ?raw SVGs.
  config.module.rules.push({
    resourceQuery: /raw/,
    type: 'asset/source',
  });
}

function inlineCss(config) {
  if (!config.module?.rules) {
    return;
  }

  // Alter Nx's asset rule to avoid inlining SVG if they have ?raw prepended.
  console.log(config.module.rules.map((r) => r.test.toString()));
  const existingRule = config.module.rules.find((r) => r.test.toString().startsWith("/\\.css"));
  existingRule.resourceQuery = { not: [/raw/] };
}

function externalJson(config) {
  if (!config.module?.rules) {
    return;
  }
  
  // Add a rule for prepending ?external.
  config.module.rules.push({
    resourceQuery: /external/,
    type: 'asset/resource',
  });
}