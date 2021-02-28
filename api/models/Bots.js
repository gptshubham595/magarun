'use strict';

const _ = require('lodash');

// Import rethinkdbdash
var r = require('../db');

// Declare Bots object
const Bots = {};

// insert
Bots.insert = function (uid, name, min, max, cmax, cmin, callback) {
    name = _.toString(name);
    r.table("Bots").insert({uid: uid, name: name, min: min, max: max, cmax: cmax, cmin: cmin}).run(r.conn)
};

// Get
Bots.get = function (rand, callback) {
    r.table("Bots").orderBy('rand').limit(rand).run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    callback(users)
                });
        })
};

// delete
Bots.delete = function (id, callback) {
    r.table('Users').filter({ id: id }).delete().run(r.conn).then(function(err, result) {
        callback(err, result);
    })
};

// Export the Bots module
module.exports = Bots;