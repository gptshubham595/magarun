var numeral     = require('numeral')
var validator   = require('validator');
var User        = require("../../models/User");
var Withdrawl   = require("../../models/Withdrawl");
var WAValidator = require('wallet-address-validator');
var Date        = require('../../Date');
var config      = require('../../config');
const bc        = require('../../bitcoin_client');
var authentication = require('../../authentication');

function convertToBits(val){
    number = val / 100000000;
    return (number*100).toFixed(8).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1");
}

module.exports = function (socket, crypter) {
    /**
     * Send Response to Client
     * @param status
     * @param amount
     */
    var sendToClient = function (status) {
        socket.emit('submit_new_withdrawl', {status: status});
    };

    /**
     * Submit New User Withdrawal
     * @param uid
     * @param wallet
     * @param amount
     * @param immed
     */
    function newWithdrawal(uid, wallet, amount, immed, password) {
        const { isNumeric } = validator;

        var validate = WAValidator.validate(wallet, 'bitcoin');

        if (!validate) {
            return sendToClient('Please enter valid wallet address.');
        }

        if(!isNumeric(amount)){
            return sendToClient('Please check your inputs.');
        }

        if(amount == 0 || amount < 10){
            return sendToClient('Please check your inputs.');
        }

        //Validate password

        User.getPasswordFromId(uid, (hash) => {
            // Compare the password entered to the hash from the database
            authentication.comparePassword(password, hash, (match) => {

                if(!match){
                    return sendToClient('Your password not match with your account!');
                }

                // Get the user bits
                User.getUserBits(uid, (result) => {

                    // Set User Bits
                    var setNumber = numeral();
                    setNumber.set(result);
                    const cash = setNumber._value;

                    // Set Amount
                    var setAmount = numeral();
                    setAmount.set(amount);
                    const amountRequested = setAmount._value;

                    // Plus immediately with requested amount
                    var setImmed  = numeral(immed);
                    var addImmed = setImmed.add(amountRequested);

                    // Get The full amount want to withdrawl
                    const fullAmount = addImmed._value;

                    //if user not have enough cash
                    if (cash === 0 || amount > cash) {
                        return sendToClient('Your cash is not enough.');
                    }

                    var newCash = cash - fullAmount;
                    var finalAmount = fullAmount;

                    finalAmount = convertToBits(finalAmount);

                    bc.sendToAddress(wallet, finalAmount, uid, function (err, res) {
                        if (!err) {
                            //Save Withdrawl
                            console.log('res is: ', res)
                            Withdrawl.create(uid, fullAmount, wallet, res, Date.date, () => {
                                User.reduceUserCash(uid, newCash, (result) => {
                                    if(result){
                                        return sendToClient('Your Withdrawl Request was sended.');
                                    }
                                });
                            });

                        }
                        else {
                            return sendToClient('Please Try again later.');
                        }
                    });

                });


            })
        })
    }
    return {
        newWithdrawal
    }
};