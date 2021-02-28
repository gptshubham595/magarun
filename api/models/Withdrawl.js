'use strict';

// Import rethinkdbdash
var r = require('../db');

// Declare Withdrawl object
const Withdrawal = {};

// Create Withdrawl
Withdrawal.create = function (uid, amount, wallet, txid, date, callback) {
    r.table("Withdrawal").insert({
        uid: uid,
        date: date,
        amount: amount,
        wallet: wallet,
        status: txid
    }).run(r.conn).then(function(result) {
        callback(result);
    })
};

//Get All User Withdrawal
Withdrawal.getAllWithdrawl = function (id, callback) {
    r.table('Withdrawal')
        .filter({ uid: id })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0 ){
                        callback(false)
                    }
                    else {
                        callback(result);
                    }
                });
        });
};

// Change Withdrawl Status
Withdrawal.change = function (id, status, callback) {
    r.table('Withdrawal')
        .filter({ id: id })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length == 0 ){
                        callback(false)
                    }
                    else {
                        r.table("Withdrawal").get(id).update({status: status}).run(r.conn, callback(true))
                    }
                });
        });
};

// Export the Withdrawal module
module.exports = Withdrawal;