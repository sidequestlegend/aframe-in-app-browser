const path = require('path');
const webpack = require("webpack");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    entry: {
        "aframe-in-app-browser": "./src/index.js",
        "aframe-in-app-browser.min": "./src/index.js",
    },
    mode:"development",
    devtool: "source-map",
    output: {
        path: __dirname+"/dist",
        filename: "[name].js"
    },
    devServer: {
        stats: "errors-only",
        contentBase: __dirname+"/dist",
        open:true
    },
    optimization: {
        minimize: true,
        minimizer: [new UglifyJsPlugin({
            include: /\.min\.js$/
        })]
    }
};