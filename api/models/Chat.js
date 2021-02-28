'use strict';

// Import rethinkdbdash
var r = require('../db');

// Declare Chat object
const Chat = {};

// Get All Chats
Chat.getAllChats = function (room, callback) {
    r.table('Chat')
        .filter({ room: room })
        .orderBy('date')
        .limit(50)
        .run(r.conn)
        .then(function(cursor) {
            return cursor.toArray()
                .then(function (result) {
                    callback(result)
                });
        })
};

// Submit New Chats
Chat.submitChat = function (uid, username, message, room, time, date, callback) {
    if(message === undefined) return;
    r.table("Chat").insert({
        uid: uid,
        room: room,
        message: message,
        username: username,
        time: time,
        date: date
    }).run(r.conn).then(function(result) {
        callback(result);
    })
};

// Export the Chat module
module.exports = Chat;