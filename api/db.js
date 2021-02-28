/*jshint node:true */
'use strict';

var config = require('./config');

var q = require('q');
var r = require('rethinkdb');
require('rethinkdb-init')(r);

// Connection
r.init(config.rethinkdb,[])
    .then(function (conn) {
      r.conn = conn;
      r.conn.use(config.rethinkdb.db);
    });

module.exports = r;