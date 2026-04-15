const path = require('path');
const fs = require('fs');

class CopyStaticAssetsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyStaticAssetsPlugin', () => {
      const source = path.resolve(__dirname, 'src/index.html');
      const targetDir = path.resolve(__dirname, 'dist');
      const target = path.resolve(targetDir, 'index.html');

      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(source, target);
    });
  }
}

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        include: [path.resolve(__dirname, '../../docs/_includes/examples')],
        type: 'asset/source',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new CopyStaticAssetsPlugin()],
};
