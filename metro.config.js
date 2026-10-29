// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Remotion promo, the Laravel backend and the website are separate projects — keep Metro out of them.
// Anchored to this folder: packages have their own `web/` folders (react-native-gesture-handler's web build).
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = ['promo', 'backend', 'web'].map(
  (dir) => new RegExp(`^${escape(path.join(__dirname, dir) + path.sep)}.*`),
);

module.exports = config;
