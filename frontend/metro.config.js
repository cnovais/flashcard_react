const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver for problematic modules
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Add resolver for pretty-format plugins
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config; 