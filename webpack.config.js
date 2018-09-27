const webpack = require('atool-build/lib/webpack')
const path = require('path')
const HappyPack = require('happypack')
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// 构造出共享进程池，进程池中包含5个子进程
const happyThreadPool = HappyPack.ThreadPool({ size: 5 });

module.exports = function (webpackConfig, env) {

  if('development' !== '' + env){
    // 取出环境变量
    env = process.env.NODE_ENV;
  }

  console.log('env:', env);

  webpackConfig.babel.plugins.push('transform-runtime')
  webpackConfig.babel.plugins.push(['import', {
    libraryName: 'antd',
    style: true,
  }])

  // Support hmr
  if (env === 'development') {
    //webpackConfig.devtool = 'source-map'
    webpackConfig.devtool = '#eval'
    webpackConfig.babel.plugins.push(['dva-hmr', {
      entries: [
        './src/index.js',
      ],
    }])
  } else {
    webpackConfig.babel.plugins.push('dev-expression')
    webpackConfig.entry = { index: './src/_index.js' }
  }

  // Don't extract common.js and common.css
  webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => {
    return !(plugin instanceof webpack.optimize.CommonsChunkPlugin)
  })

  //获取服务器环境
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      ENV: JSON.stringify(env)
    })
  )
  // Support CSS Modules
  // Parse all less files as css module.
  webpackConfig.module.loaders.forEach((loader) => {
    if (typeof loader.test === 'function' && loader.test.toString().indexOf('\\.less$') > -1) {
      loader.include = /node_modules/
      loader.test = /\.less$/
    }
    if (loader.test.toString() === '/\\.module\\.less$/') {
      loader.exclude = /node_modules/
      loader.test = /\.less$/
    }
    if (typeof loader.test === 'function' && loader.test.toString().indexOf('\\.css$') > -1) {
      loader.include = /node_modules/
      loader.test = /\.css$/
    }
    if (loader.test.toString() === '/\\.module\\.css$/') {
      loader.exclude = /node_modules/
      loader.test = /\.css$/
    }
  })
  //使用dll
  webpackConfig.plugins.push(
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('./dll/manifest.json')
    })
  )
  //使用happypack
  webpackConfig.module.rules = [
    {
      test: /\.js$/,
      use: ['happypack/loader?id=babel'],
      exclude: path.resolve(__dirname, 'node_modules'),
      include: path.resolve(__dirname, 'src'),
    }
  ]
  webpackConfig.plugins.push(
    new HappyPack({
      id: 'babel',
      loaders: ['babel-loader?cacheDirectory'],
      threadPool: happyThreadPool,
    })
  )
  //使用alias
  webpackConfig.resolve.alias = {
    'Src': path.resolve(__dirname, './src'),
    'Components': path.resolve(__dirname, './src/components'),
    'Utils': path.resolve(__dirname, './src/utils'),
    'Biz': path.resolve(__dirname, './src/biz')
  }
  //快速查找node_modules
  webpackConfig.resolve.modules =  [path.resolve(__dirname, 'node_modules')]
  //不必要监听
  webpackConfig.watchOptions = {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000
  }
  //分析
  // var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  // webpackConfig.plugins.push(new BundleAnalyzerPlugin())

  return webpackConfig
}
