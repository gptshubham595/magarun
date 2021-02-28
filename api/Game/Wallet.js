var User      = require("../models/User");
var Withdrawl = require("../models/Withdrawl");
var Deposit   = require("../models/Deposit");

module.exports = function (socket, crypter) {
    /**
    * Get Withdrawl
    * @param uid
    */
    function getWithdrawls(uid)
    {
        Withdrawl.getAllWithdrawl(uid, (result) => {
            var res = {
                data: result
            };
            socket.emit('withdrawl_history', res);
        });
    }

    function saveUserDeposit(id, amount){
        Deposit.checkDeposit(id, amount, (result) => {
            if(!result){
                Deposit.saveDeposit(id, amount, (err) => {
                    if(err) console.log(err)
                    var result = {
                        command: 'new_deposit',
                        uid: id
                    };
                    socket.emit('message',result);
                });
            }
        });
    }

    function getUserBits(uid){
        User.getUserBits(uid, (err, bits) => {
            if(err) throw err;
            //Admin profit (default is 20)
            // bits = parseInt(bits - 20);
            var result = {
                command: 'get_bits',
                uid: uid,
                bits: bits
            };
            socket.emit('message',result);
        });
    }
    return {
        getWithdrawls,
        saveUserDeposit,
        getUserBits
    }
};