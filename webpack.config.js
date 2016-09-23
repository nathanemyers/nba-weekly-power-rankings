//const path = require('path');

module.exports = {
  entry: ['./src/main.js', './src/scaffolding.jsx'],
  output: {
    path: './dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        }
      },
      //{ test: /\.less$/, loader: 'style-loader!css-loader!less-loader' }, // use ! to chain loaders
      //{ test: /\.css$/, loader: 'style-loader!css-loader' },
      //{ test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' } // inline base64 URLs for <=8k images, direct URLs for the rest
    ]
  },
  watch: true,
  devServer: {
    port: 8080,
    host: 'localhost'
  }
};
