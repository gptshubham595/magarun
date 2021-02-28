const User = require('../../models/User');
const bc = require('../../bitcoin_client');

module.exports = function (socket, crypter) {
    /**
     * Get User Wallet
     * @param uid
     */
    function makeWallet(uid)
    {
        User.getUserWallet(uid, function (result) {
            if(!result){
                bc.getNewAddress(uid, function (err, wallet) {
                    if (!err) {
                        /**
                         * Save User Wallet to db
                         * Emit Wallet to user
                         */
                        User.updateUserWallet(uid, wallet,function() {
                            socket.emit('make_wallet', {
                                command: "make_wallet",
                                uid: uid,
                                data: wallet
                            });
                        });
                    }
                });
            }
            else {
                socket.emit('make_wallet', {
                    command: "make_wallet",
                    data: result,
                    uid: uid
                });
            }
        });
    }
    return {
        makeWallet
    }
};