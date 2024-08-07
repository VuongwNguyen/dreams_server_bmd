const nodemailer = require("nodemailer");
require("dotenv").config();

const sendmail = async (option) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail(option);
  return info;
};

module.exports = sendmail;
