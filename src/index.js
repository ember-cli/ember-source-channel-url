'use strict';

const got = require('got');
const caw = require('caw');

module.exports = function(channelType) {
  let HOST = process.env.EMBER_SOURCE_CHANNEL_URL_HOST || 'https://s3.amazonaws.com';
  let PATH = 'builds.emberjs.com';
  let url = `${HOST}/${PATH}/${channelType}.json`;

  let agent = {
    http: caw({ protocol: 'http' }),
    https: caw({ protocol: 'https' }),
  };

  let opts = { json: true, agent };

  return got(url, opts).then(result => `${HOST}/${PATH}${result.body.assetPath}`);
};
