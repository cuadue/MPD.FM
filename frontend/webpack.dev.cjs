const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");

module.exports = {
  mode: "development", // this will trigger some webpack default stuffs for dev
  entry: "./src/index.tsx", // if not set, default path to './src/index.js'. Accepts an object with multiple key-value pairs, with key as your custom bundle filename(substituting the [name]), and value as the corresponding file path
  output: {
    //filename: "[name].bundle.js", // [name] will take whatever the input filename is. defaults to 'main' if only a single entry value
    path: path.resolve(__dirname, "dist"), // the folder containing you final dist/build files. Default to './dist'
    publicPath: "/"
  },
  devServer: {
    historyApiFallback: true, // to make our SPA works after a full reload, so that it serves 'index.html' when 404 response
    liveReload: false,
    port: 3000,
  },
  devtool: "inline-source-map", // a sourcemap type. map to original source with line number
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    }),
    new FaviconsWebpackPlugin({
      logo: './src/assets/icon.svg',
      inject: true,
      mode: 'webapp',
    }),
  ], // automatically creates a 'index.html' for us with our <link>, <style>, <script> tags inserted! Visit https://github.com/jantimon/html-webpack-plugin for more options
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
      {
        test: /\.(png|ico|xml|webmainfest)$/,
        type: 'asset/resource'
      }
    ]
  },
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['', '.ts', '.tsx'],
    fallback: {
      fs: false,
      path: false,
    },
  },
};
