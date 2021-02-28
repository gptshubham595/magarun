var numeral      = require('numeral');
var Crypt        = require('g-crypt');
var crypter      = Crypt('node_modules/express/index.js');
var config         = require("../../config");
var Date         = require("../../Date");
var User         = require("../../models/User");
var Deposit      = require("../../models/Deposit");
var Satoshi      = require("../../Satoshi");
var bc         = require('../../bitcoin_client');

// Declare Payment object
const Payment = {};

const rate = config.wallet.updateRate;

/**
 * Get Payment Status
 */
function getPaymentStatus(io)
{
    bc.listTransactions(function (err, result) {
        if(!err){
            result.forEach((item, i) => {

                if (item.category === 'receive'){

                    var uid    = item.label;
                    var txtid  = item.txid;
                    var status = item.confirmations;
                    var amount = Satoshi.toSatoshi(item.amount);

                    Deposit.existsDeposit(txtid, function (exists) {
                        if (!exists) {

                            //Save txid to db
                            Deposit.saveDeposit(uid, amount, txtid, status, Date.datetime, function () {
                                bc.getNewAddress(uid, function (err, wallet) {
                                    if (!err) {
                                        /**
                                         * Save New User Wallet to db
                                         */
                                        User.updateUserWallet(uid, wallet,function(){});
                                    }
                                });
                            });

                            // Add User Credit then notify to user
                            User.getUserBits(uid, (result) => {
                                var setNumber = numeral();
                                setNumber.set(result);
                                const correctBits = setNumber._value;

                                // Plus User Bits with Paying Amount
                                var number  = numeral(correctBits);
                                var thisSat = number.add(amount);

                                User.plusUserCash(uid, thisSat._value, () => {
                                    let message = 'Your Transcation Was Apporoved. Your account was Charged ' + amount;
                                    io.emit('update_payment_status', {
                                        notification: true,
                                        message: message,
                                        uid: uid
                                    });
                                });
                            });

                        } else {
                            // console.log('TXID is old: ', txtid);
                        }
                    });
                }
            });
        }
    });
}

function startChecker(io){
    setInterval(function(){
        console.log('started cheker');
        getPaymentStatus(io);
    }, rate);
}

// Update Users Payment
Payment.update = function (io) {
    startChecker(io)
};

// Export the Payment module
module.exports = Payment;