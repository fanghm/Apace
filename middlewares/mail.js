var nodemailer      = require("nodemailer");
var smtpTransport   = require('nodemailer-smtp-transport');
var config          = require('../config');

exports.sendMail = function(to, title, cb) {
  var mail = {
    from: '"Apace" <no-reply@nokia.com>',
    to: (config.debug ? config.test_email : to ),  // TODO: change before formal deployment
    subject: "[Apace] An AP is assigned to you: " + title,
    text: "This is an email from Apace App, do not reply it.",
    html: "<p>Pls visit <a href='" + config.app_url + "'>Apace</a> to view/update the actions on you."
  };

  var transporter = nodemailer.createTransport(
    smtpTransport({
      host: config.smtp_server,
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