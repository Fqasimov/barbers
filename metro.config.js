// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Remotion promo is a separate project with its own node_modules — keep Metro out of it.
config.resolver.blockList = [/\/promo\/.*/];

module.exports = config;
