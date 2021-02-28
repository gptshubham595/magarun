'use strict';

const _ = require('lodash');

// Import rethinkdbdash
var r = require('../db');

// Declare Refferal object
const Refferal = {};

// insert
Refferal.insert = function (name, uid, date) {
    r.table("Refferal").insert({name: name, from: uid, date: date, status: true}).run(r.conn)
};

// Update
Refferal.update = function (uid, callback) {
    r.table("Refferal").filter({from: uid}).update({status: false}).run(r.conn, callback(true))
};

// Get
Refferal.get = function (uid, callback) {
    r.table('Refferal')
        .filter({from: uid})
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0 ){
                        callback(false)
                    }
                    else {
                        callback(result)
                    }
                });
        })
};

// Delete
Refferal.delete = function (id, callback) {
    r.table('Refferal').filter({ id: id }).delete().run(r.conn).then(function(err, result) {
        callback(err, result);
    })
};

// Export the Refferal module
module.exports = Refferal;