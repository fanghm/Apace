var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
var config     = require('../config');

exports.sendMail = function(to, cb) {
  var mail = {
    from: config.email4test,
    to: config.email4test,  // TODO: change before formal deployment
    subject: "Your action is due soon..." + to,
    text: "This is an email from Apace App, do not reply it.",
    html: "<p>Pls visit <strong>Apace</strong> to view/update the actions on you."
  };

  var transporter = nodemailer.createTransport(
    smtpTransport({
      host: config.SMTPServer,
      secure: false,
      port: 25, // port for secure SMTP
      ignoreTLS: true,
    })
  );

  transporter.sendMail(mail, function(error, info) {
    if(error) {
      cb(error);
    } else {
      cb(null, info);
    }

    transporter.close();
  });
}