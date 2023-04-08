const nodemailer = require("nodemailer");

const send = (mailOptions) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "productmastertest@gmail.com",
      pass: "nyroblowhxggpxhq",
    },
  });

  transporter.sendMail(mailOptions);
};
module.exports = send;
