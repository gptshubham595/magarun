var bitcoin = require('bitcoin');
var config = require('./config');

var client = new bitcoin.Client({
    host: '127.0.0.1',
    port: '8332',
    user: config.wallet.user,
    pass: config.wallet.pass,
    ssl: false,
    sslStrict: false
});

module.exports = client;