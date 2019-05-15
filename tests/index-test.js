'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const execa = require('execa');
const createServer = require('./helpers/server').createServer;
const getChannelURL = require('../src');
const tmp = require('tmp');

tmp.setGracefulCleanup();

const ROOT = process.cwd();
const EXECUTABLE_PATH = path.join(__dirname, '..', 'bin', 'ember-source-channel-url');

QUnit.module('ember-source-channel-url', function(hooks) {
  function randomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex');
  }

  hooks.beforeEach(function() {
    let dir = tmp.dirSync();
    process.chdir(dir.name);

    return createServer().then(server => {
      process.env.EMBER_SOURCE_CHANNEL_URL_HOST = `http://localhost:${server.port}`;

      this.server = server;
      this.fakeSHA = randomString(20);
      let assetPath = (this.assetPath = `/canary/shas/${this.fakeSHA}.tgz`);

      this.expectedURL = `http://${server.host}:${server.port}/builds.emberjs.com${this.assetPath}`;

      server.on('/builds.emberjs.com/canary.json', (req, res) => {
        res.end(JSON.stringify({ assetPath }));
      });

      return server.listen(server.port);
    });
  });

  hooks.afterEach(function() {
    process.chdir(ROOT);

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
      return execa(EXECUTABLE_PATH, ['canary']).then(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
      });
    });

    QUnit.test('updates local package.json when -w is passed (dependencies)', function(assert) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ dependencies: { 'ember-source': '^3.10.0' } }),
        { encoding: 'utf8' }
      );

      return execa(EXECUTABLE_PATH, ['canary', '-w']).then(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');

        assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
          dependencies: {
            'ember-source': this.expectedURL,
          },
        });
      });
    });

    QUnit.test('updates local package.json when --write is passed (dependencies)', function(
      assert
    ) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ dependencies: { 'ember-source': '^3.10.0' } }),
        { encoding: 'utf8' }
      );

      return execa(EXECUTABLE_PATH, ['canary', '--write']).then(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');

        assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
          dependencies: {
            'ember-source': this.expectedURL,
          },
        });
      });
    });

    QUnit.test('updates local package.json when --write is passed (devDependencies)', function(
      assert
    ) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ devDependencies: { 'ember-source': '^3.10.0' } }),
        { encoding: 'utf8' }
      );

      return execa(EXECUTABLE_PATH, ['canary', '--write']).then(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');

        assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
          devDependencies: {
            'ember-source': this.expectedURL,
          },
        });
      });
    });

    QUnit.test('fails when package.json is missing', function(assert) {
      return execa(EXECUTABLE_PATH, ['canary', '--write']).catch(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');

        assert.ok(
          results.stdout.includes('no package.json is available to update'),
          'warning is printed indicating -w failed'
        );
      });
    });

    QUnit.test('fails when ember-source is not a dep', function(assert) {
      fs.writeFileSync('package.json', JSON.stringify({}), { encoding: 'utf8' });

      return execa(EXECUTABLE_PATH, ['canary', '--write']).catch(results => {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');

        assert.ok(
          results.stdout.includes(
            'ember-source is not included in dependencies or devDependencies'
          ),
          'warning is printed indicating -w failed'
        );
      });
    });
  });
});
