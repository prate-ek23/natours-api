const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Prateek Singh Rawat <jaiHind@prateek.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

// if  I want to use Gmail or any such popular email service
// const sendEmail = options => {
//     // 1) Create a transporter
//     const transporter = nodemailer.createTransport({
//         service: 'Gmail',
//         auth: {
//             user: process.env.EMAIL_USERNAME, // this EMAIL_USERNAME and EMAIL_PASSWORD will be defined inside config.env
//             pass: process.env.EMAIL_PASSWORD
//         }
//         // activate in gamil "less secure app" option
//     })
// }

module.exports = sendEmail;
