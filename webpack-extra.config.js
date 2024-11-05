import path from "node:path";
import { EsbuildPlugin } from "esbuild-loader";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import StartupChunkDependenciesPlugin from "webpack/lib/runtime/StartupChunkDependenciesPlugin.js";
import { normalizeConfigurationWithDefine } from "./build_tools/webpack/configuration_with_define.js";

export default (env, args) => {
  const mode = args.mode === "production" ? "production" : "development";
  const config = {
    mode,
    context: import.meta.dirname,
    entry: {
      main: "./src/main.bundle.js",
    },
    performance: {
    module: {
    },
    devServer: {
        allowedHosts: ["all"],
        host: "0.0.0.0",
	client: {
        overlay: {
          // Prevent intrusive notification spam.
          runtimeErrors: false,
        },
      },
      hot: false,
      devMiddleware: {
        publicPath: "/ng/",
      },
      webSocketServer: {
        type: "sockjs",
        options: {
          host: "gladier.cels.anl.gov",
          path: "/ng/sockjs-node",
        },
      },
    },
    plugins: [
      // Fixes esm output with splitChunks
      // https://github.com/webpack/webpack/pull/17015/files
      new StartupChunkDependenciesPlugin({
        chunkLoading: "import",
        asyncChunkLoading: true,
      }),
      new webpack.ProgressPlugin(),
      ...(mode === "production"
        ? [new MiniCssExtractPlugin({ filename: "[name].[chunkhash].css" })]
        : []),
      new HtmlWebpackPlugin({
        title: "Neuroglancer",
        scriptLoading: "module",
      }),
    ],
    output: {
      path: path.resolve(import.meta.dirname, "dist", "client"),
      publicPath: "/ng/",
      filename: "[name].[chunkhash].js",
      chunkFilename: "[name].[contenthash].js",
      chunkLoading: "import",
      workerChunkLoading: "import",
      chunkFormat: "module",
      asyncChunks: true,
      module: true,
      clean: true,
    },
    target: ["es2020", "web"],
    experiments: {
      outputModule: true,
    },
    // Additional defines, to be added via `webpack.DefinePlugin`.  This is not a
    // standard webpack configuration property, but is handled specially by
    // `normalizeConfigurationWithDefine`.
    define: {
      // This is the default client ID used for the hosted neuroglancer.
      // In addition to the hosted neuroglancer origin, it is valid for
      // the origins:
      //
      //   localhost:8000
      //   127.0.0.1:8000
      //   localhost:8080
      //   127.0.0.1:8080
      //
      // To deploy to a different origin, you will need to generate your
      // own client ID from on the Google Developer Console and substitute
      // it in.
      NEUROGLANCER_BRAINMAPS_CLIENT_ID: JSON.stringify(
        "639403125587-4k5hgdfumtrvur8v48e3pr7oo91d765k.apps.googleusercontent.com",
      ),

      // NEUROGLANCER_CREDIT_LINK: JSON.stringify({url: '...', text: '...'}),
      // NEUROGLANCER_DEFAULT_STATE_FRAGMENT: JSON.stringify('gs://bucket/state.json'),
      // NEUROGLANCER_SHOW_LAYER_BAR_EXTRA_BUTTONS: true,
      // NEUROGLANCER_SHOW_OBJECT_SELECTION_TOOLTIP: true

      // NEUROGLANCER_GOOGLE_TAG_MANAGER: JSON.stringify('GTM-XXXXXX'),
    },
  };
  return env.NEUROGLANCER_CLI
    ? config
    : normalizeConfigurationWithDefine(config);
};
