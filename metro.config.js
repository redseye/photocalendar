// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Opt-in cap for machines short on memory, e.g. METRO_MAX_WORKERS=2.
if (process.env.METRO_MAX_WORKERS) {
  config.maxWorkers = Number(process.env.METRO_MAX_WORKERS);
}

module.exports = config;
