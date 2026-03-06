const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { sources } = require("webpack");

const tsRuleCode = {
  test: /\.ts$/,
  use: {
    loader: "ts-loader",
    options: {
      transpileOnly: true,
      compilerOptions: {
        target: "ES6",
      },
    },
  },
  exclude: /node_modules/,
};

const tsRuleUi = {
  test: /\.ts$/,
  use: "ts-loader",
  exclude: /node_modules/,
};

class InlineScriptPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("InlineScriptPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "InlineScriptPlugin",
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        },
        (assets) => {
          const html = assets["ui.html"]?.source();
          const js = assets["ui.js"]?.source();
          if (!html || !js) return;

          const inlined = html.replace(
            /<script\b[^>]*src=["']ui\.js["'][^>]*><\/script>/,
            `<script>${js}</script>`
          );

          compilation.updateAsset("ui.html", new sources.RawSource(inlined));
          compilation.deleteAsset("ui.js");
        }
      );
    });
  }
}

module.exports = [
  {
    name: "plugin-code",
    entry: "./src/code.ts",
    output: {
      filename: "code.js",
      path: path.resolve(__dirname, "dist"),
      environment: {
        arrowFunction: false,
        optionalChaining: false,
        templateLiteral: false,
      },
    },
    target: "web",
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [tsRuleCode],
    },
  },
  {
    name: "plugin-ui",
    entry: "./src/ui/ui.ts",
    output: {
      filename: "ui.js",
      path: path.resolve(__dirname, "dist"),
    },
    target: "web",
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [tsRuleUi],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/ui/ui.html",
        filename: "ui.html",
        inject: "body",
        scriptLoading: "blocking",
      }),
      new InlineScriptPlugin(),
    ],
  },
];
