function SendSecretPassword({ mail, password, role, user, admin }) {
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: "Welcome to the Company - Your Account Details",
    html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Employee Account Information</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        background-color: #f9f9f9;
                    }
                    h1 {
                        color: #2a9d8f;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 15px;
                        margin-top: 20px;
                        color: white;
                        background-color: #2a9d8f;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                    .button:hover {
                        background-color: #21867a;
                    }
                    p {
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Welcome to Build My Dreams</h1>
                    <p>Dear ${user},</p>
                    <p>We are excited to welcome you to our team! Below are your account details for accessing our system:</p>
                    <p><strong>Email:</strong> ${mail}</p>
                    <p><strong>Password:</strong> <code>${password}</code></p>
                    <p>If you have any issues or questions, feel free to reach out to your manager or the IT department.</p>
                    <p>Best regards,</p>
                    <p>${admin} <br> ${role} <br> Build My Dreams</p>
                </div>
            </body>
            </html>`,
  };
}
//<p>Please change your password upon your first login for security purposes.</p>
//<a href="[company_login_url]" class="button">Login to Your Account</a>
module.exports = SendSecretPassword;
