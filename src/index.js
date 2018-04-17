'use strict';
const got = require('got');
const proxy = require('./proxy');
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const noProxy = process.env.NO_PROXY || process.env.no_proxy;

module.exports = function(channelType) {
  let HOST = process.env.EMBER_SOURCE_CHANNEL_URL_HOST || 'https://s3.amazonaws.com';
  let PATH = 'builds.emberjs.com';
  let url = `${HOST}/${PATH}/${channelType}.json`;
  let opts = { json: true };

  if (httpsProxy) {
    const agent = proxy.proxyAgent(httpsProxy, noProxy, url);

    if (agent) {
      opts.agent = agent;
    }
  }

  return got(url, opts).then(result => `${HOST}/${PATH}${result.body.assetPath}`);
};
