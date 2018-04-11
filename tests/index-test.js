'use strict';

const path = require('path');
const crypto = require('crypto');
const execa = require('execa');
const createServer = require('./helpers/server').createServer;
const getChannelURL = require('../src');

QUnit.module('ember-source-channel-url', function(hooks) {
  function randomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex');
  }

  hooks.beforeEach(function() {
    return createServer().then(server => {
      process.env.EMBER_SOURCE_CHANNEL_URL_HOST = `http://localhost:${server.port}`;

      this.server = server;
      this.fakeSHA = randomString(20);
      let assetPath = (this.assetPath = `/canary/shas/${this.fakeSHA}.tgz`);

      server.on('/builds.emberjs.com/canary.json', (req, res) => {
        res.end(JSON.stringify({ assetPath }));
      });

      return server.listen(server.port);
    });
  });

  hooks.afterEach(function() {
    return this.server.close();
  });

  QUnit.test('works', function(assert) {
    let expected = `http://${this.server.host}:${this.server.port}/builds.emberjs.com${
      this.assetPath
    }`;

    return getChannelURL('canary').then(actual => {
      assert.equal(actual, expected);
    });
  });

  QUnit.module('binary', function() {
    QUnit.test('works', function(assert) {
      let expected = `http://${this.server.host}:${this.server.port}/builds.emberjs.com${
        this.assetPath
      }`;

      let executablePath = path.join(__dirname, '..', 'bin', 'ember-source-channel-url');
      return execa(executablePath, ['canary']).then(results => {
        assert.ok(results.stdout.includes(expected), 'URL is present in stdout');
      });
    });
  });
});
