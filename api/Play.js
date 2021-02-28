//Required Libs
var _ = require('lodash');
var numeral = require('numeral');
var md5 = require("md5");
var crypto = require("crypto");
var CryptoJS = require("crypto-js");
var SHA256 = require("crypto-js/sha256");
var validator = require('validator');
var Crash = require('./models/Crash');
var User = require("./models/User");
var Bet = require("./models/Bet");
var Bank = require("./models/BankRoll");
var fakeData = require("./Fake");
var BankRoll = require("./BankRoll");
var io = require('./server.js').io;
var config = require('./config')
var DATE = require('./Date');
var Satoshi = require('./Satoshi');
var Bots = require('./models/Bots');

//Secure Socket
var Crypt = require('g-crypt');
var passphrase = 'node_modules/express/index.js', // Passport !
    crypter = Crypt(passphrase);

module.exports = function(player, player_playing){

    var winner   = [],
        history  = [],
        status   = "waiting",
        key      = "00000000000000" + randomString(50),
        lastHash = randomString(64),
        roundTime = 5000,
        crashPoint,
        timeStart,
        waitStart,
        crash_num,
        md5_code,
        gameTimeOut,
        cur_game_id;

    const {
        getBankRollAmount
    } = BankRoll();

    function randomString( length )
    {
        var chars = '0123456789abcdefghiklmnopqrstuvwxyz'.split('');
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    function gameID(){
        return cur_game_id;
    }

    function gameStatus(currentClient){
        var showRate, time, now = new Date();

        if(status == "waiting"){
            time = roundTime - (now - waitStart);
        }
        else
        {
            time = now - timeStart;
        }

        if(status == "waiting"){
            winner = [];
        }

        if(status == "busted"){
            showRate = crash_num;
        }

        var betting = 0;

        var i = 0;
        for(i in player_playing){
            var thisPlayer = player_playing[i];
            betting += parseFloat(thisPlayer.amount);
        }

        io.sockets.to(currentClient).emit('game_status',
            {
                time: time,
                players: player_playing,
                winners: winner,
                crashes: history,
                status: status,
                betting: betting,
                md5: md5_code,
                bank: getBankRollAmount()
            });
    }

    function Idle(){
        md5_code = md5(lastHash);

        cur_game_id = randomString(8);

        Crash.create(md5_code, lastHash, cur_game_id, (res) => {});

        console.log("---------------WAITING----------------");

        //Start Bots Playing
        setTimeout(() => {
            handleNextRoundFake();
        }, 500);

        waitStart = new Date();

        var message = {
            command: "waiting",
            time: roundTime,
            hash: lastHash,
            md5 : md5_code,
            game_id: cur_game_id,
            players: player_playing
        }

        io.emit('players', { players: player_playing, winners: [] });
        io.emit('waiting', message);

        status = "waiting";

        setTimeout(function(){
            startGame();
        }, roundTime);
    }

    function startGame()
    {
        // Game in here can started
        console.log("------------STARTED-------------");
        winner = [];
        status = "started";

        io.emit('players', { players: player_playing, winners: [] });

        var message = {
            command: "started",
            bank: getBankRollAmount(),
            players: player_playing,
            md5: md5_code,
            time: 100
        }

        io.emit('started', message);

        var i;

        //game mechanices here
        rate = 1;
        var result = generateResultByBankRoll();

        crash_num = result.crash;
        var hash = result.hash;

        // This is final number, no one can access to this number.
        var timeout = calculateTimeout(crash_num);

        timeStart = new Date();

        gameTimeOut = setTimeout(function(){
            bustGame(crash_num, timeout)
        }, timeout); // game in here can bust. by this timeout.

        //set time out for each player cashout setting
        var playing_length = player_playing.length;
        if(playing_length > 0)
        {
            for(i = 0; i < playing_length; i++)
            {
                var this_player = player_playing[i];
                if((this_player.cashout/100) > crash_num){
                    continue;
                }

                var player_timeout = calculateTimeout(this_player.cashout/100);
                autoCashout(this_player.uid, player_timeout);
            }
        }
    }

    function bustGame(crash_num, timeout)
    {
        console.log("---------------BUSTED----------------");
        clearTimeout(gameTimeOut);

        var i = 0;

        var message = {
            command: "busted",
            time: timeout,
            md5: md5_code,
            hash: lastHash,
            winners: winner,
            players: player_playing,
            amount : crash_num * 100,
            game_id: cur_game_id,
            bank: getBankRollAmount()
        };

        io.emit('players', { players: player_playing, winners: winner });
        io.emit('busted', message);

        status = "busted";

        var allPlayers = player_playing.concat(winner);

        var record = message;
        record.time = DATE.datetime;
        record.crash = crash_num * 100;
        record.game_id = cur_game_id;
        record.players = allPlayers;
        history.push(record);

        if(history.length > 40)
            history.shift();

        player_playing = [];

        Crash.update(crash_num, lastHash, cur_game_id, () => {});

        //wait roundTime seconds to goes to next phase
        setTimeout(function(){
            Idle();
        }, roundTime);
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function handleNextRound(uid, amount, cashout, client)
    {
		if(status !== 'waiting') return;
		
        amount = _.toNumber(amount);
		
		if(amount < 0) return;

        User.getUserBits(uid, (result) => {

            var setNumber = numeral();
            setNumber.set(result);
            const correctBits = setNumber._value;

            //Reduce Credit
            var number  = numeral(correctBits);
            var newCash = number.subtract(amount);

            // Check Bet Amount is valid
            if(!Satoshi.isHigher(newCash._value)){
                console.log('User not have cash')
                return;
            }

            User.reduceUserCash(uid, newCash._value, (res) => {
                User.findUsernameByID(uid, (uName) => {

                    User.getUserProfit(uid, (profit) => {
                        Bet.create(uid, amount, cashout, cur_game_id, uName, profit, (err, res) => {
                            if(err) throw err;
                        });
                    });

                    var index = findPlayerPlaying(uid);

                    var temp_player = {
                        uid: uid,
                        name: uName,
                        amount: amount,
                        cashout: cashout,
                        index: index,
                        in : true
                    }

                    player_playing.push(temp_player);
                    io.emit('play', temp_player);
                    io.sockets.to(client).emit('credit', { credit: newCash._value });

                    //Reduce Profit
                    User.subtractUserProfit(uid, parseFloat(amount),function (res) {})

                    //Add to BankRoll
                    var bankAmount = parseFloat(getBankRollAmount());
                    var number  = bankAmount + parseFloat(amount);
                    Bank.update(number, () => {});
                });
            });
        });
    }

    function handleNextRoundFake()
    {
        let rand = getRandomInt(25, 50);

        Bots.get(rand, function (result) {
            result.forEach((data, i) => {

                var fakePlayer = data;

                // Check For Disable Bot
                if(fakePlayer.disabled) return;

                var amount = getRandomInt(data.min, data.max);
                var cashout = getRandomInt(data.cmin, data.cmax);

                if(fakePlayer.name !== undefined){

                    User.getUserProfit(fakePlayer.uid, (profit) => {

					//LIMIT
					// let profitS = parseFloat(profit);
					// profitS -= profitS * 2;
					// if( profitS  > 20000 ){
						// return;
					// }

                        Bet.create(fakePlayer.uid, amount, cashout, cur_game_id, fakePlayer.name, profit, (err, res) => {});
                    });
                }

                var temp_player = {
                    uid: fakePlayer.uid,
                    name: fakePlayer.name,
                    amount: amount,
                    cashout: cashout,
                    in : true
                };

                User.findIdByUsername(fakePlayer.name, (user_id) => {
                    if (user_id) {
                        setTimeout(() => {
                            player_playing.push(temp_player);
                            var message = temp_player;
                            message.command = "play";
                            io.emit('play', message);

                            //Reduce Profit
                            User.subtractUserProfit(user_id, parseFloat(amount),function (res) {})

                            //Add to BankRoll
                          //  var bankAmount = parseFloat(getBankRollAmount());
                          //  var number  = bankAmount + parseFloat(amount);
                           // Bank.update(number, () => {});
                        }, getRandomInt(500, 1500));
                    }
                });
            })
        });
    }

    function handleRemoveNextRound(client)
    {
        var index = findUserWithSocket(client);
        if(index == -1){return;}

        var user = player[index];

        var i = findPlayerPlaying(user.uid);
        if(i == -1){ console.log('User Not Found'); return; }
        var cancel_user = player_playing[i];
        console.log('user: %s cancelled bet', cancel_user);

        if(i > -1)
        {
            player_playing.splice(i, 1);
        }

        player[index].cash = player[index].cash + cancel_user.amount;

        //send back the user info to all player
        var message = cancel_user;
        message.command = "cancel";
        io.emit('message', message);

        User.plusUserCash(user.uid, cancel_user.amount, () => { });

        player[index].cash = player[index].cash + cancel_user.amount;

        io.emit('credit', { credit: player[index].cash, uid: user.uid });

        //update bet record
        Bet._update(cancel_user.uid, cancel_user.amount, cur_game_id, () => { });
    }

    function handleCashout(uid){
        var index = findPlayerPlaying(uid);
        var player_info = player_playing[index];

        if(typeof player_info == "undefined")
            return

        if(player_info.in != true)
            return

        player_playing[index].in = false;

        var amount = player_info.amount;

        var result = calculateWinning(amount);

        var message = player_info;
        message.command = "finish";
        message.current = result.cashout*100;
        message.won = result.won;
        message.name = player_playing[index].name;
        winner.push(message);

        var i = 0;
        for(i in player_playing){
            var player = player_playing[i];
            if(player.uid === player_info.uid){
                player_playing.splice(i, 1);
            }
        }

        io.emit('finish', message);

        //Reduce from BankRoll
        var fullAmount = parseFloat(result.won) + parseFloat(amount);
        var number     = parseFloat(getBankRollAmount());
        var update     = number - fullAmount;

        if(update < 0){
            update = 0;
        }

        //Add User Net Profit
        User.addUserProfit(uid, fullAmount,function (res) {})

        //validate fake user by id
        if(uid.substr(0,1) === 'f')
		{
            setUserCreditFake(uid, amount, message);
            // sendFakeMessage(uid, player_info.name, amount); // DON'T TOUCH, FOR NEXT VERSION
        }
        else {
			Bank.update(update, () => {});
            setUserCredit(uid, amount, message);
        }
    }

    function generateMessage(amount) {
        var chats  = require('./chats.js');
        var list = chats.getList();
        return list[getRandomInt(0, list.length + 1)];
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

    function sendFakeMessage(uid, name, amount)
    {
        var Chat  = require('./models/Chat');
        var now = new Date();
        var time = getCurrentTime(now);
        var date = getCurrentDate(now);
        var message = generateMessage(amount);
        Chat.submitChat(uid, name, message, 'us', time, date,function(res){
            if(res){
                var msg = {
                    text: message,
                    uid : uid,
                    name : name,
                    room: 'us',
                    time : time,
                    date: date
                };
                var result = msg;
                result.command = "chat";
                io.emit('chat', result);
            }
        });
    }

    function setUserCreditFake(uid, amount, message)
    {
        var cashout = message.current / 100;
        var won = _.toNumber(message.won);
        var current = new Date().getTime();

        User.getUserProfit(uid, (profit) => {
            Bet._update(uid, cur_game_id, cashout, won, current, profit, () => {});
        });
    }

    function setUserCredit(uid, amount, message)
    {
        var cashout = message.current / 100;
        var won = message.won;

        User.getUserBits(uid, (result) => {
            var setNumber = numeral();
            setNumber.set(result);
            const correctBits = setNumber._value;

            // Plus User Bits with Bet Amount
            var number  = numeral(correctBits);
            var newCash = number.add(amount);

            // Plus User Bits with Profit Bits
            var num       = numeral(newCash);
            var calcBonus = num.add(won);

            User.plusUserCash(uid, calcBonus._value.toString(), (res) => {
                var current = new Date().getTime();
                User.getUserProfit(uid, (profit) => {
                    Bet._update(uid, cur_game_id, cashout, won, current, profit, () => {});
                });
                io.emit('credit', { credit: calcBonus._value, uid: uid });
            });
        });
    }

    function calculateTimeout( crash_num )
    {
        var time = ( Math.log( crash_num ) / Math.log(Math.E) ) / 6e-5;
        return time;
    }

    function autoCashout(uid, timeout)
    {
        setTimeout(function(){
            handleCashout(uid);
        }, timeout);
    }

    function generateResultByBankRoll(){
        var gameHash = (lastHash!=""?genGameHash(lastHash):hash);
        var gameCrash = crashPointFromBank((lastHash!=""?genGameHash(lastHash):hash));
        lastHash = gameHash;
        return {hash: gameHash, crash: gameCrash};
    }

    function genGameHash(serverSeed) {
        return SHA256(serverSeed).toString();
    }

    function crashPointFromBank(seed){
        var check = getBankRollAmount();
        var point = crashPointFromSeed(seed);

        if(check >= 1)
            return point;

        return 1.00;
    }

    function crashPointFromSeed(seed){
        let salt = seed + key;
        let hash = crypto.createHmac("sha256", salt)

        let h = parseInt(salt.slice(0, 13), 16);
        let e = Math.pow(2, 52);

        let result = Math.floor((98 * e) / (e - h));
        if (result < 100) {
            result = 100;
        }
        if (result > 10000000) {
            result = 10000000
        }
        const max = (result / 100).toFixed(2);
        if(max === 0.00){
            max = 1.00;
        }
        console.log('game was buted at: ', max);
        return max;
    }

    function calculateWinning(amount) {
        var ts = new Date();
        var rate = Math.pow(Math.E, 6e-5 * (ts - timeStart)).toFixed(2);
        var winning = amount * (rate - 1);
        return { cashout : rate, won : winning};
    }

    function findUserWithSocket(arr, socket) {
        var id = socket.id;
        var index = -1;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].id === id) {
                index = i
            }
        }
        return index;
    }

    function findPlayerPlaying(id) {
        var length = player_playing.length,
            i;
        for (i = 0; i < length; i++) {
            if (player_playing[i].uid == id) {
                return i;
            }
        }
        return -1;
    }

    return {
        Idle,
        gameID,
        gameStatus,
        handleCashout,
        handleNextRound,
        handleRemoveNextRound
    }
}
