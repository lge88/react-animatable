const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  /* historyApiFallback: true, */
  stats: {
    chunkModules: false,
    colors: true,
  },
}).listen(3000, 'localhost', function(err) {
  if (err) {
    console.log(err);
  }

  console.log('http://localhost:3000/');
});
