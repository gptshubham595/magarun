var axios         = require('axios');
var qs         = require('qs');
var express         = require('express');
var expressSession = require('express-session');
var authentication = require('./authentication');
var bodyParser      = require('body-parser');
var validator = require('validator');
var Refferal = require('./models/Refferal');
var User = require('./models/User');
var Email = require('./SendEmail');
var bc = require('./bitcoin_client');
var server = express.Router();

// Session middleware
server.use(bodyParser.urlencoded({ extended: false }));

const session = expressSession({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 } // 1 day
});

server.use(session);
server.use(authentication);

server.post('/login', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Sanitisers
    const { escape, stripLow, trim } = validator;

    // Extract data from the request's body
    let params = { username, password } = req.body;

    // Data sanitisation
    username = escape(stripLow(trim(username)));

    // Save the username to saved login data
    req.session.login = { username };

    // Find a user in the database with the username entered
    User.findIdByUsername(username, (user_id) => {
        if (user_id) {
            // Find the password for the user from the database
            User.getPasswordFromId(user_id, (hash) => {
                // Compare the password entered to the hash from the database
                authentication.comparePassword(password, hash, (match) => {
                    // If the password matches the hash
                    if (match) {
                        // Login the user
                        req.login(user_id);
                        User.authUser(user_id, (result) => {
                            result = {
                                status: true,
                                command: "auth",
                                uid: result.id,
                                name: result.username,
                                credit: result.cash,
                                friends: result.friends,
                                room: result.room,
                                avatar: getGavatar(result.email),
                                admin: false,
                                currency: "bits",
                                winners: 'winner'
                            };
                            res.send(result);
                        });
                    }
                    else {
                        res.send({ status: 'Password incorrect' });
                    }
                });
            });
        } else {
            res.send({ status: 'Username Not Found' });
        }
    });
});

// Register user route
server.post('/register', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Validators and sanitisers
    const { isAlphanumeric, isAscii, isEmail, isEmpty, isLength } = validator;
    const { escape, toBoolean, normalizeEmail, stripLow, trim } = validator;

    // Extract data from the request's body
    let { username, email, password, method, ref } = req.body;

    method = toBoolean(method);

    // Data sanitisation
    username = escape(stripLow(trim(username)));

    if(method)
        email = escape(normalizeEmail(stripLow(trim(email))));

    // Save the sanitised data to saved registration data
    req.session.register = { username, email };

    // Data validation
    let errors = [];

    if(method) {
        if(isEmpty(email))
            errors.push('Email is not valid.');
    }

    if (isEmpty(username) || isEmpty(password)) {
        errors.push('All fields must be filled.');
    } else {
        if (!isAlphanumeric(username)) errors.push('Usernames must only contain letters and numbers.');
        if (!isAscii(username)) errors.push('Usernames must only contain ASCII characters.');
        if (!isLength(username, { max: 16 })) errors.push('Usernames cannot be longer than 16 characters.');
        if(method) {
            if (!isAscii(email)) errors.push('Emails must only contain ASCII characters.');
            if (!isEmail(email)) errors.push('Emails must be valid.');
            if (!isLength(email, { max: 64 })) errors.push('Emails cannot be longer than 64 characters.');
        }
        if (!isLength(password, { min: 6 })) errors.push('Passwords must be at least 6 characters long.');
        if (!isLength(password, { max: 64 })) errors.push('Passwords cannot be longer than 64 characters long.');
    }

    // Check if the username has already been taken in the database
    User.findIdByUsername(username, (user_id) => {
        if (user_id) errors.push('Username already taken.');
        // Check if the email has already been used in the database
        User.findIdByEmail(email, (user_id) => {
            if(method)
                if (user_id) errors.push('Email already taken.');
            // If there are no errors
            if (errors.length === 0) {
                // Create a new user in the database
                var now = new Date();
                var date = now.getUTCFullYear() + "-" + (now.getUTCMonth()+1)  + "-" + now.getUTCDate();
                User.create({ username, email, password, date }, (err, user_id) => {
                    // If there was no error
                    if (!err) {

                        //Save Refferal
                        if(ref !== undefined)
                            Refferal.insert(username, ref, date, () => {});

                        // Login the user and save the username to saved login data
                        req.login(user_id);
                        req.session.login = { username };
                        res.send({ status: true });
                        // If there was an error send an error flash message and reload the login page
                    } else {
                        res.send({ status: 'Database Error' });
                    }
                });
                // If there are validation errors send the errors and reload the register page
            } else {
                res.send({ status: errors });
            }
        });
    });
});

//Logout Route
server.post('/logout', (req, res) => {
    // If the request is authenticated
    if (req.authenticated) {
        // Logout the user
        req.logout();
        // Redirect to the login route
        res.send({ status: true });
        // If the request is not authenticated send an error flash message and redirect to the login route
    } else {
        res.send({ status: true });
    }
});

//Reset Password Route
server.post('/reset_password', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Validators
    const { escape, normalizeEmail, stripLow, trim, isEmail } = validator;

    // Extract data from the request's body
    let { email } = req.body;

    email = escape(normalizeEmail(stripLow(trim(email))));

    if (!isEmail(email)){
        res.send({ status: false });
        return;
    }

    User.getUserPassword(email, (result) => {
        axios({
            url: 'https://test.magarun.io/reset.php',
            method: 'POST',
            data: qs.stringify({ password: result, email: email })
        })
        .then(function(req){
            var resu = req.data;
            if(resu.status){
				res.json({ status: true });
            }
			else {
				res.json({ status: false });
			}
        })
	});
});

//Support Route
server.post('/support', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Validators
    const { escape, normalizeEmail, stripLow, trim, isEmail } = validator;

    // Extract data from the request's body
    let { email, content } = req.body;

    email = escape(normalizeEmail(stripLow(trim(email))));

    if (!isEmail(email)){
        res.send({ status: false });
        return;
    }

    Email.support(email, content,  (result) => {});
    res.send({ status: true });
});

//IMPORTANT, DISABLE ON PRODUCTION MODE
server.get('/dev_send', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    let { wallet, amount, uid } = req.body;
    bc.sendToAddress(wallet, amount, uid, function (err, result) {
        if (!err) {
            res.send({ status: result });
        }
        else {
            res.send({ status: false });
        }
    });
});

//IMPORTANT, DISABLE ON PRODUCTION MODE
server.get('/dev_balance', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    bc.getBalance( function (err, result) {
        if (!err) {
            res.send({ status: result });
        }
        else {
            res.send({ status: false });
        }
    });
});

/*
* Get Gravatar
* @param userList {Object} Object with key value pairs of Users
* @param username {String}
* @return userList {Object} Object with key value pairs of Users
*/
function getGavatar(email)
{
    const { stripLow, trim } = validator;
    var md5 = require("md5");

    var url = 'https://www.gravatar.com/avatar/',
        md5 = md5( stripLow( trim( email ) ) ),
        size = "?s=150&d=mp&r=g";

    return url + md5 + size;
}


module.exports = server;