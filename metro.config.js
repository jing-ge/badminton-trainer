const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 让 Metro Bundler 把 tflite 识别为合法的静态资源而不是 JS 代码
config.resolver.assetExts.push('tflite');

module.exports = config;
