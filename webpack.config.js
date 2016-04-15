module.exports = {
  entry: './ng-current.js',
  output: {
    path: __dirname,
    filename: 'ng-current.bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'ng-annotate' },
      // { test: /\.js$/,   exclude: /node_modules/, loader: 'ng-annotate' },
      // { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' }
    ]
  }
}
