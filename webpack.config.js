const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: "development",
  entry: "./index.tsx",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js)$/,
        use: "babel-loader",
        exclude: path.resolve(__dirname, "./node_modules"),
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"),
    }),
    // new BundleAnalyzerPlugin()
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "./dist"),
    },
    compress: true,
    port: 8081,
    open: true,
  },
};
