import path from "path";
import type { Configuration } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

const config: Configuration = {
  mode: "production",
  entry: path.resolve(__dirname, "./src/index.tsx"),
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].[contenthash].js",
    clean: true
  },
  devtool: "hidden-source-map",
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
  ],
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js)$/,
        use: "babel-loader",
        exclude: path.resolve(__dirname, "./node_modules")
      }
    ]
  },
  optimization: {
    // splitChunks: {
    //   chunks: "all",
    //   cacheGroups: {
    //     vendors: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: "vendors"
    //       chunks: 'all',
    //     }
    //   }
    // }
    // minimize: true,
    // minimizer: [
    //   new TerserPlugin({
    //     parallel: true,
    //     terserOptions: { compress: { drop_console: true } }
    //   })
    // ]
  }
};

export default config;
