// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Remotion promo, the Laravel backend and the website are separate projects — keep Metro out of them.
config.resolver.blockList = [/\/promo\/.*/, /\/backend\/.*/, /\/web\/.*/];

module.exports = config;
