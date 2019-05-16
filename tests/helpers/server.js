'use strict';

const http = require('http');
const RSVP = require('rsvp');
const getPort = require('get-port');

const host = (module.exports.host = 'localhost');

module.exports.createServer = function() {
  return getPort().then(port => {
    let s = http.createServer((req, resp) => s.emit(req.url, req, resp));

    s.host = host;
    s.port = port;
    s.url = `http://${host}:${port}`;
    s.protocol = 'http';

    s.listen = RSVP.denodeify(s.listen);
    s.close = RSVP.denodeify(s.close);

    return s;
  });
};
