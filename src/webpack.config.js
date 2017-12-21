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
			"./src/app"
		]
	},
	output: {
		path: path.join(__dirname, '/../dist/'),
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
				include: /fontawesome-webfont/, // exclude app svgs (e.g. ../all/app/icon-camera.svg from ./app.css)
				loader: 'file-loader',
				options: { name: 'fonts/[name].[ext]' }
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg)$/,
				exclude: /fontawesome-webfont/, // fontawesome-webfont.svg
				loader: 'file-loader',
				options: { name: 'img/[name].[ext]' }
			},
			{
				test: /\.tag(.html)?$/,
				exclude: /node_modules/,
				loader: 'riot-tag-loader',
				options: {
					//type: 'es6', // NO!!!
					hot: true,
					debug: true
				}
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: 'body',
			hash: true,
			template: './src/index.html',
			filename: 'index.html'
		})
	]
};
