const LaunchDarkly = require('launchdarkly-node-server-sdk');

// Initialize the LaunchDarkly client
const ldClient = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY);

// Wait for the client to be ready
const initLD = async () => {
  try {
    await ldClient.waitForInitialization();
    console.log('LaunchDarkly SDK successfully initialized.');
    return ldClient;
  } catch (error) {
    console.error('LaunchDarkly SDK failed to initialize:', error);
    throw error;
  }
};

module.exports = { ldClient, initLD }; 