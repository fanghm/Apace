var nodemailer      = require("nodemailer");
var smtpTransport   = require('nodemailer-smtp-transport');
var config          = require('../config');

exports.sendMail = function(action, cb) {
  action.le_str = action.le_time();
  var mail = {
    from: '"Apace" <no-reply@nokia.com>',
    to: (config.debug ? config.test_email : action.owner.email),
    subject: "[Apace] Please take action: " + action.title,
    action: action,
    apace_url: config.app_url,
  };

  var transporter = nodemailer.createTransport(
    smtpTransport({
      host: config.smtp_server,
      secure: false,
      port: 25, // port for secure SMTP
      ignoreTLS: true,
    })
  );

  // Note: template filename must contain html., text., style., and subject. respectively.
  // Refer: https://github.com/crocodilejs/node-email-templates#supported-template-engines
  var EmailTemplate = require('email-templates').EmailTemplate;

  var template = new EmailTemplate('views/mail');
  template.render(mail).then(function (renderedMail) {
    // console.log('Rendered mail: ', renderedMail);  // html, text, subject

    var send = transporter.templateSender(renderedMail);
    send(mail, cb);
    transporter.close();
  });
}