'use strict';

const _ = require('lodash');

// Import rethinkdbdash
var r = require('../db');

// Declare BankRoll object
const BankRoll = {};

// update
BankRoll.update = function (amount, callback) {
    amount = _.toString(amount);
    r.table("BankRoll").get(1).update({amount: amount}).run(r.conn, callback(true))
};

// Get
BankRoll.get = function (callback) {
    r.table('BankRoll').get(1).run(r.conn).then(function(result) {
        if(result === null){
            r.table("BankRoll").insert({ id: 1, amount: '0' }).run(r.conn, callback(true));
        }
        else callback(result.amount);
    })
};

// Export the BankRoll module
module.exports = BankRoll;