const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web',
  devtool: 'inline-source-map',

  resolve: {
    extensions: [
      ".js"
    ]
  },
  entry: {
    app: [
      "babel-polyfill",
      "./src/app.js"
    ]
  },
  output: {
    path: path.join(__dirname, '/../dist/'),
    //publicPath: '/',
    filename: "[name].min.js"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader', options: { base: 2000 } },
          'css-loader'
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)/,
        include: /fontawesome-webfont/, // exclude app svgs
        loader: 'file-loader',
        options: { name: 'fonts/[name].[ext]' }
      },
      {
        test: /\.(svg|png|jpg|jpeg|gif)/,
        exclude: /fontawesome-webfont/, // exclude fonts
        loader: 'file-loader',
        options: { name: 'img/[name].[ext]' }
      },
      {
        enforce: 'pre',
        test: /\.tag(.html)?$/,
        exclude: /node_modules/,
        loader: 'riot-tag-loader',
        query: {
          type: 'none'
        }
      },
      {
        test: /\.js$|\.tag(.html)?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          babelrc: false,
          presets: [
            [
              "env",
              {
                "targets": {
                  "ie": [
                    "9"
                  ]
                }
              }
            ],
            //"stage-0"
          ]
        },
      }
    ]
  },
  plugins: [
    //new HtmlWebpackPlugin({
    //  inject: 'body',
    //  hash: true,
    //  template: './src/index.ejs',
    //  filename: 'index.ejs'
    //})
  ]
};
