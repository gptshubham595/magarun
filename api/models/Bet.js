'use strict';

// Import rethinkdbdash
var r = require('../db');

const _ = require('lodash');

// Declare Bet object
const Bet = {};

Bet.create = function(user_id, amount, auto_cashout, crash_id, username, profit, callback){
    const date = new Date().getTime();
    r.table(user_id).insert({
        username: username,
        user_id: user_id,
        crash_id: crash_id,
        amount: _.toString(amount),
        auto_cashout: auto_cashout,
        lose: _.toString(amount),
        profit: _.toString(profit),
        date: date
    }).run(r.conn)
        .then(function (error, result) {
            callback(error, result)
    });

    //for games
    r.table('Bet').insert({
        username: username,
        user_id: user_id,
        crash_id: crash_id,
        amount: _.toString(amount),
        auto_cashout: auto_cashout,
        lose: _.toString(amount),
        profit: _.toString(profit),
        date: date
    }).run(r.conn)
        .then(function (error, result) {
            callback(error, result)
    })
};

Bet._update = function(uid, gameID, cashout, won, date, profit){
        r.table(uid)
        .filter({ crash_id: gameID })
        .update({ won: won, auto_cashout: cashout, date: date, profit: profit, lose: 0 })
        .run(r.conn);

        // for games
        r.table('Bet')
        .filter({ crash_id: gameID, user_id: uid })
        .update({ won: won, auto_cashout: cashout, date: date, profit: profit, lose: 0 })
        .run(r.conn)
};

// Get user stats by id
Bet.getUserStats = function (uid, callback){
    r.table(uid)
        .orderBy(r.desc('date'))
        .limit(10)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0){
                        callback([0])
                    }
                    else {
                        callback(result)
                    }
                });
        })
};

// Get user chart with pagination
Bet.getUserChart = function (uid, page, callback){
    page = parseFloat(page);
    let multi = page * 2;
    let eachPage = multi + 10;
    r.table(uid)
        .orderBy(r.desc('date'))
        .slice(multi, eachPage)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0){
                        callback([0])
                    }
                    else {
                        callback(result)
                    }
                });
        })
};

// Get user stats by username (not used)
Bet._getUserStats = function (username, callback){
    r.table(uid)
        .filter({username: username})
        .orderBy(r.desc('date'))
        .limit(10)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0 ){
                        callback([0])
                    }
                    else {
                        callback(result)
                    }
                });
        })
};

// Get Game Details
Bet.gameDetails = function (id, callback) {
    r.table('Bet')
        .filter({crash_id: id})
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0 ){
                        callback(null)
                    }
                    else {
                        callback(result)
                    }
                });
        })
};

// Export the Bet module
module.exports = Bet;