/*
 * Copyright (C) 2014-present Cloudflare, Inc.

 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

'use strict';
const shouldProxy = require('should-proxy');
const HttpsProxyAgent = require('https-proxy-agent');
const proxyAgent = function proxyAgent(httpsProxy, noProxy, base) {
  if (!httpsProxy) {
    return null;
  }
  noProxy = noProxy || '';

  const ok = shouldProxy(base, {
    no_proxy: noProxy,
  });

  if (!ok) {
    return null;
  }

  return new HttpsProxyAgent(httpsProxy);
};

module.exports.proxyAgent = proxyAgent;
