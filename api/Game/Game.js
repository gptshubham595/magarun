var Bet     = require("../models/Bet");
var Crash   = require("../models/Crash");

module.exports = function (socket, crypter){
    /*
    * Get Game Details
    * @param id
    */
    function handleGameDetails(uid, id)
    {
        Bet.gameDetails(id, (res) => {
            Crash.get(id, (error, info) => {
                var result = {
                    id: id,
                    uid: uid,
                    data: res,
                    info: info
                };
                socket.emit('game_details',result);
            });
        });
    }
    return {
        handleGameDetails
    }
};