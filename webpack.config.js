const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: ['./src/index.ts'],
  module: {
    rules: [
      /*
      {
        test: /\.(jsonc|json5|cson)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'dist'
            },
          },
        ],
      },
      */
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: "/node_modules/",
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json', '.jsonc'],
    modules: [path.resolve(__dirname, 'dist'), 'node_modules']
    /* alias: {
      Settings: path.resolve(__dirname, 'config/'),
    }*/
  },
  plugins: [
    new CopyWebpackPlugin([
        { from: 'config', to: 'config' },
        { from: 'locales', to: 'locales' }
      ], 
        { debug: 'info' })
  ],
  externals: {
    /* lettura di file esterni al bundle */
    "fs": "require('fs')",
    "path": "require('path')",
    'Settings': 
    "require('fs').readFileSync(require('path').resolve('config', 'settings.jsonc'), 'utf8')",
    'SettingsExample': 
    "require('fs').readFileSync(require('path').resolve('config', 'settings.example.jsonc'), 'utf8')",
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'dist',
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js'
  },
  // Needed to have in compiled output imports Node.JS can understand.
  target: 'node',
  // This forces webpack not to compile TypeScript for one time, but to stay running, watch for file changes in project directory and re-compile if needed
  watch: true
};