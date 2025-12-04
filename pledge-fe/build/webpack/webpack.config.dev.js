const path = require('path');
const { merge } = require('webpack-merge');
const { HotModuleReplacementPlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const base = require('./webpack.config.base'); // 基础Webpack配置
const config = require('../config'); // 项目配置文件

const { SRC_ROOT } = require('../utils/getPath'); // 获取源码根目录路径

// 设置开发环境下的静态资源公共路径
// 原配置指向开发服务器地址，现改为相对路径以便正确加载资源
base.output.publicPath = '/';

module.exports = merge(base, {
  target: 'web', // 构建目标为浏览器环境
  mode: 'development', // 开发模式（启用开发优化）
  devtool: 'eval-source-map', // 源码映射方式：快速重建，源码级别映射

  // 文件监听选项
  watchOptions: {
    aggregateTimeout: 600, // 文件变更后延迟600ms再编译（防抖）
  },

  // 开发服务器配置
  devServer: {
    contentBase: path.resolve(SRC_ROOT, './dist'), // 静态资源根目录
    open: true, // 启动后自动打开浏览器
    openPage: '', // 自动打开的初始页面（空字符串表示根路径）
    hot: true, // 启用热模块替换（HMR）
    host: config.dev.ip, // 服务器主机（从config读取）
    port: config.dev.port, // 服务器端口（从config读取）
    compress: true, // 启用gzip压缩

    // 代理配置：解决开发环境跨域问题
    proxy: {
      '/pos/*': {
        // 匹配以/pos开头的API请求
        target: 'http://b.slasharetest.com/', // 转发到测试服务器
        changeOrigin: true, // 修改请求头中的Origin为目标地址
        secure: true, // 验证SSL证书
      },
    },

    // 历史API回退：支持React Router等单页应用路由
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/index.html' }, // 根路径重定向到index.html
      ],
    },
  },

  // 插件配置
  plugins: [
    // 清理构建目录插件（开发模式下仅首次构建时清理）
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false, // 热更新时不清理文件，避免中断
    }),

    // Webpack内置热更新插件
    new HotModuleReplacementPlugin(),

    // React官方热更新插件：提供组件级热重载，保留状态
    new ReactRefreshWebpackPlugin(),
  ],
});
