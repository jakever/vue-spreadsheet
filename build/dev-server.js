var config = require('../config')
if (!process.env.NODE_ENV) process.env.NODE_ENV = config.NODE_ENV
// 自动打开浏览器插件
var opn = require('opn')
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
var webpackConfig = require('./webpack.dev.conf');
var port = process.env.PORT || config.dev.port
var compiler = webpack(webpackConfig);

/**
 * 利用webpack-dev-server启动
 */
var uri = 'http://10.1.7.150:' + port
var server = new WebpackDevServer(compiler, {
    // hot: true,
    watchOptions: {
        aggregateTimeout: 100,
        poll: 1000
    },
    stats: {
        chunks: false, // Makes the build much quieter
        colors: true
    }
});
server.listen(port, function() {
    console.log('正  在  编  译  中  ...  片  刻  后  可  访  问 '+uri)
    opn(uri)
});