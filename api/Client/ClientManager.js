module.exports = function(socket, allSocket) {
    let chatHistory = [];

    function broadcastMessage(message) {
        allSocket.emit('chat', message)
    }

    function addEntry(entry) {
        chatHistory = chatHistory.concat(entry);
    }

    return {
        addEntry,
        broadcastMessage
    };
};