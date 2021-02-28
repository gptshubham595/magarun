const Chat  = require('../models/Chat');
const User  = require('../models/User');
const       _  = require('lodash');

module.exports = function (socket, allSocket, crypter) {

    const {
        broadcastMessage,
        addEntry
    } = require("../Client/ClientManager")(socket, allSocket);

    /*
    * Handle / Add User Chat
    * @param uid
    */
    function hadleSubmitChat(uid, message, room){
        var now = new Date();
        var time = getCurrentTime(now);
        var date = getCurrentDate(now);
        User.findUsernameByID(uid, function(name){
            Chat.submitChat(uid, name, message, room, time, date,function(res){
                if(res){
                    var msg = {
                        text: message,
                        uid : uid,
                        name : name,
                        room: room,
                        time : time,
                        date: date
                    };
                    addEntry(msg);
                    var result = msg;
                    result.command = "chat";
                    broadcastMessage(result);
                }
            });
        });
    }

    /*
    * Custom Admin Message
    * @param name, message, room
    */
    function hadleSubmitBotChat(name, message, room){
        var now = new Date();
        var time = getCurrentTime(now);
        var date = getCurrentDate(now);

        User.findIdByUsername(name, function(uid){
            if(uid){
                Chat.submitChat(uid, name, message, room, time, date,function(res){
                    if(res){
                        var msg = {
                            text: message,
                            uid : uid,
                            name : name,
                            room: room,
                            time : time,
                            date: date
                        };
                        addEntry(msg);
                        var result = msg;
                        result.command = "chat";
                        broadcastMessage(result);
                    }
                });
            }
        });
    }

    function hadleSubmitCommand(message, room) {
        var now = new Date();
        var time = getCurrentTime(now);
        var date = getCurrentDate(now);

        var command = message;

        // var cmdReg = /\s(.*?)$/;
        // var cmdMatch =  _.filter(message, _.matches(cmdReg));
        //
        // if(cmdMatch){
        //     console.log(cmdMatch[1])
        // }

        switch (command) {
            case "help":
                command = 'For the see full command please visit on https://github.com/bot/crash';
                break;

            case "rainon":
                command = "Correct synax is < Amount > < Players number >";
                break;

            default:
                command = 'Please Enter Correct Command. or visit our docs on https://github.com/bot/crash';
        }

        Chat.submitChat(1, 'System', command, room, time, date,function(res){
            if(res){
                var msg = {
                    text: command,
                    uid : "1",
                    name: "System",
                    room: room,
                    time : time,
                    date: date
                };
                addEntry(msg);
                var result = msg;
                result.command = "chat";
                setTimeout(function(){
                    broadcastMessage(result);
                }, 1000);
            }
        });
    }

    function getCurrentTime(now){
        var hr  = now.getHours();
        var min = now.getMinutes();
        var sec = now.getSeconds();
        hr = (hr<10) ? '0'+hr : ''+hr;
        min = (min<10) ? '0'+min : ''+min;
        sec = (sec<10) ? '0'+sec : ''+sec;
        return hr + ':' + min + ':' + sec;
    }

    function getCurrentDate(now){
        var hr  = now.getHours();
        var min = now.getMinutes();
        var sec = now.getSeconds();
        var mill = now.getMilliseconds().toString();
        var date = now.getDate().toString();
        var day = now.getDay().toString();
        var month = now.getMonth().toString();
        var year = now.getFullYear().toString();
        return date+day+month+year+hr+min+sec+mill;
    }

    return {
        hadleSubmitChat,
        hadleSubmitBotChat,
        hadleSubmitCommand
    }
};