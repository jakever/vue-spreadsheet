'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config') // 基本配置的参数
const merge = require('webpack-merge') // webpack-merge是一个可以合并数组和对象的插件
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf') // webpack基本配置文件（开发和生产环境公用部分）
const CopyWebpackPlugin = require('copy-webpack-plugin')
// html-webpack-plugin用于将webpack编译打包后的产品文件注入到html模板中
// 即在index.html里面加上<link>和<script>标签引用webpack打包后的文件
const HtmlWebpackPlugin = require('html-webpack-plugin')
// friendly-errors-webpack-plugin用于更友好地输出webpack的警告、错误等信息
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT) // 读取系统环境变量的port

// 合并baseWebpackConfig配置
module.exports = merge(baseWebpackConfig, {
  module: {
    // 对一些独立的css文件以及它的预处理文件做一个编译
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // 最新的配置为 cheap-module-eval-source-map，虽然 cheap-module-eval-source-map更快，但它的定位不准确
  // 所以，换成 eval-source-map
  devtool: 'cheap-module-eval-source-map',

  // these devServer options should be customized in /config/index.js
  devServer: { //  webpack-dev-server服务器配置
    clientLogLevel: 'warning', // console 控制台显示的消息，可能的值有 none, error, warning 或者 info
    historyApiFallback: { //这个配置属性是用来应对返回404页面时定向到特定页面用的
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true, // 开启热模块加载
    inline: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host, // process.env 优先
    port: PORT || config.dev.port, // process.env 优先
    open: config.dev.autoOpenBrowser, //当open选项被设置为true时，dev server将直接打开浏览器
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    stats: 'minimal',
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable, // 代理设置
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: { // 启用 Watch 模式。这意味着在初始构建之后，webpack 将继续监听任何已解析文件的更改
      poll: config.dev.poll, // 通过传递 true 开启 polling，或者指定毫秒为单位进行轮询。默认为false
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.ProvidePlugin({
      Vue: 'vue/dist/vue.common.js'
    }),
    // HotModule 插件在页面进行变更的时候只会重绘对应的页面模块，不会重绘整个 html 文件
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(), // 跳过编译时出错的代码并记录下来，主要作用是使编译后运行时的包不出错
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html', // 指定编译后生成的html文件名
      template: 'index.html', // 需要处理的模板, 打包过程中输出的js、css的路径添加到html文件中, css文件插入到head中
      inject: true // js文件插入到body中，可能的选项有 true, 'head', 'body', false
    }),
    // copy custom static assets
    // new CopyWebpackPlugin([
    //   {
    //     from: path.resolve(__dirname, '../static'),
    //     to: config.dev.assetsSubDirectory,
    //     ignore: ['.*']
    //   }
    // ]),
    new FriendlyErrorsPlugin()
  ]
})
