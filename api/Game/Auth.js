const _ = require('lodash');
var User = require("../models/User");
var Bet = require("../models/Bet");
var Bots = require("../models/Bots");

module.exports = function (socket, crypter) {

    function getAllUsers(page)
    {  
        console.log("I am here");
        User.getAllUsers(page, (result) => {
            socket.emit('all_users_',{page: page, data: result});
            console.log("I am here2");
        });
    }

    function getAllBots(page)
    {
        User.getAllBots(page, (result) => {
            socket.emit('all_bots',{page: page, data: result});
        });
    }

    function changeMuting(id)
    {
        User.checkForMuted(id, (status) => {
            let setMute = true;
            if(status){
                setMute = false;
            }
            User.userMuting(id, setMute, () => {
                socket.emit('mute_user');
            });
        });
    }

    function disableBot(id)
    {
        User.checkForDisabled(id, (status) => {
            let setDisable = true;
            if(status){
                setDisable = false;
            }
            User.disableBot(id, setDisable, () => {
                socket.emit('disable_bot');
            });
        });
    }

    function deleteTargetUser(target)
    {
        User.deleteUser(target, (err, res) => {
            if(err) status = false;
            else status = true;
            var result = {
                command: "delete_user_",
                status: status
            };
            socket.emit('delete_user_', result);
        });
        Bots.delete(target, (err, res) => {});
    }

    function changeTargetCash(target,cash)
    {
       User.changeBalance(target, cash, (err, res) => {
            if(err) {
                console.log('ERROR: ', err)
            }
            socket.emit('edit_balance');
        });
    }

    function handleEdit(id, email, pass)
    {
        User.updateUserProfile(id, email, pass, (res) => {
            if(pass.length < 6){
                var result = {
                    message: 'Password must be more than 6 words !',
                    status: false
                };
            }
            else {
                if(!res){
                    var result = {
                        message: 'Email already was taken.',
                        status: false
                    };
                }
                else {
                    var result = {
                        status: true
                    };
                }
            }
            socket.emit('edit_account',result);
        });
    }

    /**
     * Get User Info by name
     * @param name
     */
    function handleUserInfo(name) {
        User.findIdByUsername(name, (uid) => {
            if(!uid){
                socket.emit('user_info', {status: false});
                return null;
            }
            Bet.getUserStats(uid, (info) => {
                if(info === null) return null;
                User.findUserById(uid, (details) => {
                    var won, date, id, profit;
                    try {
                        won = details[0].won;
                        date = details[0].date;
                        id = details[0].id;
                        profit = details[0].profit;
                    }
                    catch(e){
                        won = details.won;
                        date = details.date;
                        id = details.id;
                        profit = details.profit;
                    }
                    User.getFriends(id, (err, res) => {
                        var result = {
                            id: id,
                            won: won,
                            data: info,
                            name: name,
                            played: info.length,
                            date: date,
                            friend: res,
                            profit: profit
                        };
                        socket.emit('user_info', result);
                    });
                });
            });
        });
    }

    /**
     * Get User Chart with pagination
     * @param uid
     * @param page
     */
    function handleUserChart(uid, page) {
        Bet.getUserChart(uid, page, (info) => {
            if(info === null) return null;
            var result = {
                data: info
            };
            socket.emit('user_chart', result);
        });
    }

    function addFriend(uid, name)
    {
        User.addToFriend(uid, name, (res) => {
            var result = {
                name: name,
                data: res.list,
                status: res.status
            };
            socket.emit('add_friend', result);
        });
    }

    function sendTip(uid, target, amount)
    {
        User.findIdByUsername(target, (targetID) => {
            User.sendTipToUser(uid, targetID, amount, (result) => {
                socket.emit('send_tip', {status: result, target: target});
            });
        });
    }

    function handleUserInfo2(name) {
        User.findIdByUsername(name, (uid) => {
            if(!uid){
                socket.emit('user_info', {status: false});
                return null;
            }
            Bet.getUserStats(uid, (info) => {
                if(info === null) return null;
                User.findUserById(uid, (details) => {
                    var won, date, id, profit;
                    try {
                        won = details[0].won;
                        date = details[0].date;
                        id = details[0].id;
                        profit = details[0].profit;
                    }
                    catch(e){
                        won = details.won;
                        date = details.date;
                        id = details.id;
                        profit = details.profit;
                    }
                    User.getFriends(id, (err, res) => {
                        var result = {
                            id: id,
                            won: won,
                            data: info,
                            name: name,
                            played: info.length,
                            date: date,
                            friend: res,
                            profit: profit
                        };
                        socket.emit('user_info', result);
                    });
                });
            });
        });
    }


    return {
        deleteTargetUser,
        changeTargetCash,
        handleUserInfo,
        handleUserChart,
        changeMuting,
        disableBot,
        handleEdit,
        getAllUsers,
        getAllBots,
        addFriend,
        sendTip,
    }
};