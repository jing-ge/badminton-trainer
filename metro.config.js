const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 让 Metro Bundler 把 ogg 音频识别为合法的静态资源
config.resolver.assetExts.push('ogg');

module.exports = config;
