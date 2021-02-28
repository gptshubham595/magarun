//Required Libs
var compression = require('compression');
var _       = require('lodash');
var express = require('express');
var server  = express();
var app     = require('http').createServer(server);
var io      = module.exports.io = require('socket.io')(app);
var Chat    = require("./models/Chat");
var Play    = require("./Play");
var config  = require('./config');
var User    = require('./models/User');
var AutoPayment   = require('./Game/Wallet/AutoPaymentUpdate');
var r=require("rethinkdb");
//Secure Socket
var Crypt = require('g-crypt');
var passphrase = 'node_modules/express/index.js', // Passport !
    crypter = Crypt(passphrase);

//Players Object
var player = [];
var player_playing = [];

//Compress All Responses
server.use(compression());

//Auth Middleware
var auth = require('./Auth');
server.use('/auth', auth);

server.get('/', function (req, res) {
    res.send("Api is Work");
});
server.get('/admin', function (req, res) {
    res.send("Admin is Work");
});

//Socket Connections
io.on('connection', function(socket){

    //Get Current Client
    var currentClient = socket.id;

    //Auth and Join new User
    socket.on('auth', function(data){
        var user = socket;
        user.id = data.uid;
        user.uid = data.uid;
        user.username = data.name;
        user.name = data.name;
        user.cash = data.credit;
        user.credit = data.credit;
        player.push(user);
    });

    //Disconnect User
    socket.on('disconnect', function(){});

    //Get Game Status after a page was loaded
    socket.on('game_status', function(){
        gameStatus(currentClient);
    });

    //Game Handler
    socket.on('message', function(data){
        require('./Handler')(data, socket, io, crypter);
    });

    //User Credit
    socket.on('credit', function(uid){
        User.getUserBits(uid, (result) => {
            io.sockets.to(currentClient).emit('credit', {credit: result, uid: uid});
        });
    });

    //User Credit
    socket.on('depositer', function(data){
		let { amount, uid } = data;
        User.getUserBits(uid, (result) => {
			let full = parseFloat(result) + parseFloat(amount);
			User.plusUserCash(uid, full, () => {
				socket.emit('depositer');
				socket.emit('credit', {uid: uid, credit: full});
			})
        });
    });

    //Play User
    socket.on('play', function(data){
        var dd = data;
        handleNextRound(dd.uid, dd.amount, dd.cashout, currentClient)
    });

    //Remove User
    socket.on('cancel', function(data){
        var dd = data;
        handleRemoveNextRound(dd.uid)
    });

    //Cahout User
    socket.on('finish', function(data){
        var dd = data;
        handleCashout(dd.uid)
    });

    //Get All Chat
    socket.on('all_chat', function(room){
        Chat.getAllChats(room, (chats) => {
            socket.emit('all_chat', _.reverse(chats));
        });
    });

    //Check for Muted User
    socket.on('is_muted', function(uid){
        var dd =uid;
        User.checkForMuted(dd, (result) => {
            socket.emit('is_muted', { status: result });
        });
    });

    //Get LeaderBoard
    socket.on('leader', function(){
        User.getLeaderboard((result) => {
            result = sortByBits(result);
            socket.emit('leader',{ data: _.reverse(result) });
        });
    });

    //Get Stats
    socket.on('game_stats', function(){
        User.getBets((result) => {
            console.log(result)
        });
    });
});

function sortByBits(input) {
    function r(c) {
        return c.cash ? - c.cash : null;
    }
    return _.sortBy(input, r);
}

//Play Game Functions
const {
    Idle,
    gameStatus,
    handleCashout,
    handleNextRound,
    handleRemoveNextRound
} = Play(player, player_playing);

//Start Game
Idle();

//Auto Update Users Payments
// AutoPayment.update(io);

app.listen(config.socket.port, function(){
    console.log('listening on *:' + config.socket.port);
});

// app.listen(3000, '127.0.0.1');
// console.log('Node server running on port 3000');