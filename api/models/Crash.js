'use strict';

// Import rethinkdbdash
var r = require('../db');

// Declare Crash object
const Crash = {};

// Create crash
Crash.create = function (md5, sha, gameID, callback) {
    const date = new Date().getTime();
    r.table("Crash").insert({
        md5: md5,
        hash: sha,
        crash_id: gameID,
        date: date
    }).run(r.conn)
        .then(function (error, result) {
            callback(error, result)
        })
};

// Update crash
Crash.update = function (busted, hash, gameID, callback) {
    r.table('Crash')
        .filter({ crash_id: gameID })
        .update({ bust: busted })
        .run(r.conn, callback(true));
};

// Get a crash
Crash.get = function (gameID, callback) {
    r.table('Crash')
        .filter({crash_id: gameID})
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length !== 0){
                        callback(false, result[0]);
                    }
                    else callback(true, [0]);
                });
        })
};

// Export the Crash module
module.exports = Crash;