var User = require("../models/User");
var Bots = require("../models/Bots");

function randomNumber( length )
{
    var chars = '1234567890'.split('');
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

module.exports = function (socket, crypter) {
    /**
     * Register Bots
     * @constructor
     */
    function registerBot(name, min, max, cmax, cmin)
    {
        var now = new Date();
        var date = now.getUTCFullYear() + "-" + (now.getUTCMonth()+1)  + "-" + now.getUTCDate();
        var rand = randomNumber(8);
        var userID = 'f' + rand ;
        var user = {
            uid: userID,
            cash: "999999999999999",
            username: name,
            email: name + rand + '@gmail.com',
            password: name + rand,
            date: date,
            disabled: false
        };
        User.create(user, function () {
            Bots.insert(userID, name, min, max, cmax, cmin);
        })
    }
    return {
        registerBot
    }
};