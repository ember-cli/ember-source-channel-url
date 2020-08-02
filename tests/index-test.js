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

QUnit.module('ember-source-channel-url', function (hooks) {
  function randomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex');
  }

  hooks.beforeEach(async function () {
    let dir = tmp.dirSync();
    process.chdir(dir.name);

    let server = await createServer();
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

  hooks.afterEach(function () {
    process.chdir(ROOT);

    return this.server.close();
  });

  QUnit.test('works', async function (assert) {
    let expected = `http://${this.server.host}:${this.server.port}/builds.emberjs.com${this.assetPath}`;

    let actual = await getChannelURL('canary');
    assert.equal(actual, expected);
  });

  QUnit.module('binary', function () {
    QUnit.test('works', async function (assert) {
      let results = await execa(EXECUTABLE_PATH, ['canary']);
      assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
    });

    QUnit.test('when the terminal is not a TTY return only the URL', async function (assert) {
      let file = tmp.fileSync();
      await execa(EXECUTABLE_PATH, ['canary'], { stdout: file.fd });
      assert.equal(
        fs.readFileSync(file.name, { encoding: 'utf8' }),
        this.expectedURL,
        'stdout is the URL'
      );
    });

    QUnit.test('updates local package.json when -w is passed (dependencies)', async function (
      assert
    ) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ dependencies: { 'ember-source': '^3.10.0' } }),
        { encoding: 'utf8' }
      );

      let results = await execa(EXECUTABLE_PATH, ['canary', '-w']);
      assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
      assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
        dependencies: {
          'ember-source': this.expectedURL,
        },
      });
    });

    QUnit.test('updates local package.json when --write is passed (dependencies)', async function (
      assert
    ) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ dependencies: { 'ember-source': '^3.10.0' } }),
        { encoding: 'utf8' }
      );

      let results = await execa(EXECUTABLE_PATH, ['canary', '--write']);
      assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
      assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
        dependencies: {
          'ember-source': this.expectedURL,
        },
      });
    });

    QUnit.test(
      'updates local package.json when --write is passed (devDependencies)',
      async function (assert) {
        fs.writeFileSync(
          'package.json',
          JSON.stringify({ devDependencies: { 'ember-source': '^3.10.0' } }),
          { encoding: 'utf8' }
        );

        let results = await execa(EXECUTABLE_PATH, ['canary', '--write']);
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
        assert.deepEqual(JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' })), {
          devDependencies: {
            'ember-source': this.expectedURL,
          },
        });
      }
    );

    QUnit.test('preserves line ending when updating package.json', async function (assert) {
      fs.writeFileSync(
        'package.json',
        JSON.stringify({ dependencies: { 'ember-source': '^3.10.0' } }, null, 2) + '\n',
        { encoding: 'utf8' }
      );

      let results = await execa(EXECUTABLE_PATH, ['canary', '--write']);
      assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
      let expected =
        JSON.stringify({ dependencies: { 'ember-source': this.expectedURL } }, null, 2) + '\n';
      assert.deepEqual(fs.readFileSync('package.json', { encoding: 'utf8' }), expected);
    });

    QUnit.test('fails when package.json is missing', async function (assert) {
      try {
        await execa(EXECUTABLE_PATH, ['canary', '--write']);
      } catch (results) {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
        assert.ok(
          results.stdout.includes('no package.json is available to update'),
          'warning is printed indicating -w failed'
        );
      }
    });

    QUnit.test('fails when ember-source is not a dep', async function (assert) {
      fs.writeFileSync('package.json', JSON.stringify({}), {
        encoding: 'utf8',
      });

      try {
        await execa(EXECUTABLE_PATH, ['canary', '--write']);
      } catch (results) {
        assert.ok(results.stdout.includes(this.expectedURL), 'URL is present in stdout');
        assert.ok(
          results.stdout.includes(
            'ember-source is not included in dependencies or devDependencies'
          ),
          'warning is printed indicating -w failed'
        );
      }
    });
  });
});
