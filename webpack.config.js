const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",

  // Entry point — pakai .tsx
  entry: "./src/index.tsx",

  // untuk dev-mode
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/",
    clean: true,
  },

  resolve: {
    // Urutan penting: .tsx dan .ts dulu sebelum .js
    extensions: [".tsx", ".ts", ".jsx", ".js"], // Webpack mengizinkan penulisan import tanpa ekstensi (misal: import { Button } from '@mui/material').
  },

  module: {
    rules: [
      {
        // Handle .tsx, .ts, .jsx, .js via babel-loader
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            // Gunakan babel.config.json yang sudah dibuat
            configFile: true,
          },
        },
      },
      {
        // Handle CSS (opsional, tambah jika perlu)
        test: /\.css$/,
        use: ["style-loader", "css-loader", "@tailwindcss/webpack"],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],

  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 3235,
    hot: true,
    open: true,
    historyApiFallback: true,
  },

  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
};
