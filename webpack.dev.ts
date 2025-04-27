import path from "path";
import type { Configuration } from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
// import BundleAnalyzerPlugin from "webpack-bundle-analyzer";

const config: Configuration & { devServer: DevServerConfiguration } = {
  mode: "development",
  entry: path.resolve(__dirname, "./src/index.tsx"),
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].bundle.js",
    clean: true
  },
  devtool: "eval-source-map",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/")
    },
    extensions: [".tsx", ".ts", ".jsx", ".js", "json"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html")
    })
    // new BundleAnalyzerPlugin()
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "./dist")
    },
    port: 8081,
    compress: true,
    hot: true,
    open: true
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js)$/,
        use: "babel-loader",
        exclude: path.resolve(__dirname, "./node_modules")
      }
    ]
  }
};

export default config;
