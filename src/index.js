'use strict';
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

// Returns the value of an environment variable using a case-insenstive key
function getEnv(key) {
  const envKey = Object.keys(process.env).find(
    (envKey) => envKey.toLowerCase() === key.toLowerCase()
  );
  return envKey ? process.env[envKey] : null;
}

module.exports = async function (channelType) {
  let HOST = process.env.EMBER_SOURCE_CHANNEL_URL_HOST || 'https://s3.amazonaws.com';
  let PATH = 'builds.emberjs.com';
  let PROXY = getEnv('HTTPS_PROXY') || getEnv('HTTP_PROXY');
  let NO_PROXY = getEnv('NO_PROXY');
  let NO_PROXY_LIST = NO_PROXY ? NO_PROXY.split(',') : [];
  let options = {};

  // Use proxy if
  // 1. HTTPS_PROXY or HTTP_PROXY environment variables are set and
  // 2. the host URL is not in NO_PROXY
  let shouldUseProxy = PROXY && NO_PROXY_LIST.every((exclude) => !HOST.includes(exclude));
  if (shouldUseProxy) {
    options.agent = new HttpsProxyAgent(PROXY);
  }

  const response = await fetch(`${HOST}/${PATH}/${channelType}.json`, options);
  const result = await response.json();

  return `${HOST}/${PATH}${result.assetPath}`;
};
