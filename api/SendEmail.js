var nodemailer = require('nodemailer');
var config = require('./config');
var User = require('./models/User');

function sendEmail(details, callback) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    });

    transporter.sendMail(details, function(error, info){
        if (error) {
            callback(error);
        } else {
            callback('Email sent: ' + info.response);
        }
    });
}

exports.support = function (from, content, callback) {
    var details = {
        from: from,
        to: config.email.user,
        replyTo: from,
        subject: config.Base.Title + ' Contact (' + from + ')',
        html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
            '<html xmlns="http://www.w3.org/1999/xhtml">' +
            '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
            '<title>' + config.Base.Title + '</title>' +
            '</head>' +
            '<body>' +
            '<table width="100%" cellpadding="0" cellspacing="0" bgcolor="e4e4e4"><tr><td> <table id="top-message" cellpadding="20" cellspacing="0" width="600" align="center"> <tr> <td></td> </tr> </table> <table id="main" width="600" align="center" cellpadding="0" cellspacing="15" bgcolor="ffffff"> <tr> <td> <table id="content-1" cellpadding="0" cellspacing="0" align="center"> <tr> <td width="570" valign="top"> <table cellpadding="5" cellspacing="0"> <div style="background-color:#000;"> <div style="text-align:center;margin-left: 230"> </div> </div> </td> </tr> </table> </td> </tr> <tr> <td> <table id="content-6" cellpadding="0" cellspacing="0"> <p> ' + content + ' </p> </table> </td> </tr> </table> </td></tr></table>' +
            '</body></html>'
    };

    sendEmail(details, callback);
};

exports.passwordReset = function (to, callback) {
    User.getUserPassword(to,  (result) => {
        var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
            '<html xmlns="http://www.w3.org/1999/xhtml">' +
            '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
            '<title>' + config.Base.Title + ' Password Reset</title>' +
            '</head>' +
            '<body>' +
            '<h2>Your Password on ' + config.Base.Title + ':</h2>' +
            '<br>' +
            result +
            '<br>' +
            '<br>' +
            "<span>We only send password resets to registered email accounts." +
            '</body></html>';

        var mailOptions = {
            from: config.email.user,
            to: to,
            subject: config.Base.Title + ' - Reset Password Request',
            html: html
        };

        sendEmail(mailOptions, callback);
    });
};