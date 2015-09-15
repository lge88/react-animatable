const path = require('path');
const webpack = require('webpack');

const entries = [
  { name: 'demo0', path: './demos/demo0/index.js' },
  { name: 'demo1', path: './demos/demo1/index.js' },
].reduce(function(sofar, entry) {
  sofar[entry.name] = [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    entry.path,
  ];
  return sofar;
}, {});

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: entries,
  output: {
    filename: '[name]/bundle.js',
    publicPath: '/demos/',
    path: path.join(__dirname, 'demos'),
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['react-hot', 'babel'],
      exclude: /node_modules/,
      include: __dirname,
    }],
  },
};
