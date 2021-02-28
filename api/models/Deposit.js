'use strict';

// Dependencies
var md5 = require("md5");

// Import rethinkdbdash
var r = require('../db');

// Declare Deposit object
const Deposit = {};

// Save New Deposit
Deposit.saveDeposit = function (uid,amount,txtid,status,date,callback) {
    r.table("Deposit").insert({
        uid: uid,
        amount: amount,
        salt: md5(txtid),
        txtid: txtid,
        status: status,
        date: date
    }).run(r.conn).then(function(result) {
        callback(result);
    })
};

// Update Deposit
Deposit.updateDeposit = function (txid,status,callback) {
    r.table("Users").filter({"txtid": txid}).update({status: status}).run(r.conn, callback(true))
};

// Get All User Deposits
Deposit.getAllDeposit = function (uid,callback) {
    r.table('Deposit')
        .filter({uid: uid})
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

// Check for exists deposit
Deposit.existsDeposit = function (txtid, callback) {
    r.table('Deposit')
        .filter({txtid: txtid})
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    if(result.length === 0 ){
                        callback(false)
                    }
                    else {
                        callback(true)
                    }
                });
        })
};

// Export the Deposit module
module.exports = Deposit;