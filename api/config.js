module.exports = {
    wallet: {
        user: "multichainrpc", // bitcoin user
        pass: "j3536YzAeJMXRZXLkt94bqmeWYWaKGNjETtDwAN2w6T",  // bitcoin password
        updateRate: 12000, // Update users deposit // 12000 = 2 Min
        balance: '11640' // Define Site Balance - Example: 11640 bits = 100 USD
    },
    socket: {
        host: "127.0.0.1",
        port: 80
    },
    rethinkdb: {
        host: 'localhost',
        port: 28015,
        authKey: '',
        db: 'crash_game'
    },
    Base: {
        Title: "Crash",
        URL: ""
    },
    email: {
        user: '', // Gmail User ( full email address)
        pass: '', // Gmail Password
    },
    env: 'pro', //pro
	_key: 'secret'
};