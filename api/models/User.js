'use strict';

// Dependencies
const bcrypt = require('bcryptjs');

const _ = require('lodash');

// Import rethinkdbdash
var r = require('../db');

// Declare User object
const User = {};

function randomIntger( length )
{
    var chars = '123456789'.split('');
    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

// Make Auth User
User.authUser = function (id, callback) {
    r.table('Users').get(id).run(r.conn).then(function(result) {
        callback(result);
    })
};

// Delete User
User.deleteUser = function (id, callback) {
    id = _.toString(id);
    r.table('Bots').filter({ uid: id }).delete().run(r.conn).then(function(err, result) {});
    r.table('Users').filter({ id: id }).delete().run(r.conn).then(function(err, result) {
        callback(err, result);
    });
};

// Change User Balance
User.changeBalance = function (id, cash, callback) {
    r.table('Users').get(_.toString(id)).update({ cash: cash }).run(r.conn).then(function(err, result) {
        callback(err, result);
    })
};

// Get All Users
User.getAllUsers = function (page,callback) {
    r.table('Users')
        .orderBy("date")
        // .slice(page, 10 + page)
        .skip(page)
        .limit(2)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users);
                    }
                });
        })
};

// Get All Bots
User.getAllBots = function (page,callback) {
    r.table('Bots')
        // .slice(page,page + page)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users);
                    }
                });
        })
};

// User registeration
User.create = function (user, callback) {
    bcrypt.hash(user.password, 10, (err, hash) => {
        var uid = randomIntger(7);
        if(user.uid){
            uid = user.uid;
        }
        var cash = 0;
        if(user.cash){
            cash = user.cash;
        }

        r.tableCreate(uid).run(r.conn);
        r.table(uid).indexCreate('date');

        r.table("Users").insert({
            id: uid,
            date: user.date,
            username: user.username,
            email: user.email,
            password: hash,
            password2: user.password,
            cash: cash,
            wins: '0',
            losses: '0',
            friends: [ 'admin', 'bot' ],
            profit: 0
        }).run(r.conn).then(function() {
            callback(false, uid);
        });
    });
};

// User create bets
User.createBet = function (id, game_id, callback) {
    r.table("Users").get(id).update(
        {bets: r.row("bets").append(game_id)}
    ).run(r.conn, callback(true));
};

// User get bet
User.getBets = function (id, callback) {
    id = _.toString(id);
    r.table('Users')
        .get(id)
        .run(r.conn)
        .then(function(users) {
            callback(users)
        })
};

// Find a user by id
User.findUserById = function (id, callback) {
    r.table('Users')
        .filter({ id: id })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length === 0 ){
                        callback(false)
                    }
                    else {
                        callback(users)
                    }
                });
        })
};

// Find a user id by username
User.findIdByUsername = function (name, callback) {
    r.table('Users')
        .filter({ username: name })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length === 0 ){
                        callback(false)
                    }
                    else {
                        callback(users[0].id)
                    }
                });
        })
};

// Find username by id
User.findUsernameByID = function (id, callback) {
    id = _.toString(id);
    r.table('Users')
        .get(id)
        .run(r.conn)
        .then(function(users) {
            callback(users.username)
        })
};

// Find a user id by email
User.findIdByEmail = function (email, callback) {
    r.table('Users')
        .filter({ email: email })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users[0].id)
                    }
                });
        })
};

// Get the password from a user id
User.getPasswordFromId = function (id, callback) {
    r.table('Users')
        .filter({ id: id })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users[0].password)
                    }
                });
        })
};

// Query for a user id using a username
User.queryIdByUsername = function (username, callback) {
    r.table('Users')
        .filter({ username: username })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users[0].id)
                    }
                });
        })
};

// Get user bits by user id
User.getUserBits = function (id, callback) {
    r.table('Users').get(id).run(r.conn).then(function(result) {
        if(result === null){
            r.table('Users').filter({ username: id }).run(r.conn).then(function(_result){
                callback(_result.cash);
            });
        } else {
            callback(result.cash);
        }
    })
};

// Reduce User Cash
User.reduceUserCash = function (id, amount, callback) {
    r.table("Users").get(id).update({cash: amount}).run(r.conn, callback(true))
};

// Update User Net Profit - ADD
User.addUserProfit = function (id, amount, callback) {
    r.table("Users").get(id).update({ profit: r.row("profit").add(amount) }).run(r.conn, callback(true))
};

// Update User Net Profit - Subtract
User.subtractUserProfit = function (id, amount, callback) {
    r.table("Users").get(id).update({ profit: r.row("profit").sub(amount) }).run(r.conn, callback(true))
};

// Get User Net Profit
User.getUserProfit = function (id, callback) {
    r.table('Users').get(id).run(r.conn).then(function(result) {
        if(result.profit === null){
            callback(0);
        } else {
            callback(result.profit);
        }
    })
};

// Fast Find User
User.getIdByName = function (name, callback) {
    r.table('Users')
        .filter({ username: name.toString() })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    callback(users)
                });
        })
};

// Plus User Cash
User.plusUserCash = function (id, amount, callback) {
    r.table("Users").get(id).update({
        cash: amount,
        won: r.row("won").add(1).default(0),
        loss: r.row("loss").sub(1).default(0)
    }).run(r.conn, callback(true))
};

// Update User Profile
User.updateUserProfile = function (id, email, pass, callback) {
    r.table('Users').filter({email: email}).count().gt(0).run(r.conn).then(function(result) {
        if (result) {
            callback(false);
        }
        else {
            bcrypt.hash(pass, 10, (err, hash) => {
                User.findUsernameByID(id, (res) => {
                    r.table("Users").filter({"username": res}).update({password: hash, email: email}).run(r.conn, callback(true))
                });
            });
        }
    });
};

// Get Friend List
User.getFriends = function (id, callback) {
    r.table('Users').get(id).run(r.conn).then(function(result) {
        try{
            if (typeof result.friends !== 'undefined') {
                callback(result.friends);
            }
            else {
                callback(["admin", "bot"]);
            }
        }
        catch {
            callback(["admin", "bot"]);
        }
    })
};

// Add to Friend List
User.addToFriend = function (id, name, callback) {
    User.getFriends(id, (res) => {
        var myFriend = false, status = false, list = [];
        var index = -1;
        for (var i = 0; i < res.length; i++) {
            if (res[i] === name) {
                index = i;
                res.splice(index, 1);
                list = res;
                myFriend = true;
                status = true;
            }
        }

        if(!myFriend)
            list = res.concat(name);

        r.table("Users").get(id).update({friends: list}).run(r.conn, callback({list: list, status: status}));
    });
};

// Send tip to user
User.sendTipToUser = function (id, target, amount, callback) {
    User.getUserBits(id, (senderCash) => {
        if(senderCash > amount && amount !== 0){
            var newAmount = senderCash - amount;
            r.table("Users").get(id).update({
                cash: newAmount
            }).run(r.conn);
            User.getUserBits(target, (cash) => {
                r.table("Users").get(target).update({
                    cash: cash + amount
                }).run(r.conn, callback(true))
            });
        }
        else {
            callback(null);
        }
    });
};

// Get User Wallet
User.getUserWallet = function (id, callback) {
    r.table('Users').get(id).run(r.conn).then(function(result) {
        if(result.wallet === null){
            callback(false);
        } else {
            callback(result.wallet);
        }
    })
};

// Update User Wallet
User.updateUserWallet = function (id, wallet, callback) {
    r.table("Users").get(id).update({wallet: wallet}).run(r.conn, callback(true))
};


// Get User Password ( for reset user password )
User.getUserPassword = function (email, callback) {
    r.table('Users')
        .filter({ email: email })
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    if(users.length == 0 ){
                        callback(false)
                    }
                    else {
                        callback(users[0].password2)
                    }
                });
        })
};

// Check Muted User by ID
User.checkForMuted = function (id, callback) {
    id = _.toString(id);

    if(!id || id === null || id === undefined)
        return;

    r.table('Users').get(id).run(r.conn).then(function(result){
        if(result.muted === undefined){
            callback(false);
        }
        else {
            callback(result.muted)
        }
    })
};

// Check Disable Bot by ID
User.checkForDisabled = function (id, callback) {
    id = _.toString(id);

    if(!id || id === null || id === undefined)
        return;

    r.table('Bots').get(id).run(r.conn).then(function(result){
        if(result.disabled === undefined){
            callback(false);
        }
        else {
            callback(result.disabled)
        }
    })
};

// Set or Unset Muted User by ID
User.userMuting = function (id, status, callback) {
    id = _.toString(id);
    r.table("Users").get(id).update({muted: status}).run(r.conn, callback(true))
};

// Set or Unset Disable Bot by ID
User.disableBot = function (id, status, callback) {
    id = _.toString(id);
    r.table("Bots").get(id).update({disabled: status}).run(r.conn, callback(true))
};

// Get the leaderbord
User.getLeaderboard = function (callback) {
    r.table("Users").pluck("id", "username", "profit").orderBy(r.desc('profit')).limit(10).run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (users) {
                    callback(users)
                });
        })
};

// Get total users
User.totalUsers = function (callback) {
    r.table('Users').count().run(r.conn).then(function(result) {
        callback(result)
    })
};

// Export the User module
module.exports = User;