var Deposit      = require("../../models/Deposit");

module.exports = function (socket, crypter) {
    /**
     * Get User Deposit history
     * @param uid
     */
    function depositHistory(uid){
        Deposit.getAllDeposit(uid, (result) => {
            socket.emit('deposit_history',{ data: result });
        });
    }
    return {
        depositHistory
    }
};