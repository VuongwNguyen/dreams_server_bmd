function SendNotifyMakeAdmin({ mail, user, admin, role, newRole }) {
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: "Account Access Update",
    html: `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Access Update</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.5;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            padding: 20px;
                            background: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #4CAF50;
                        }
                        p {
                            margin: 10px 0;
                        }
                        .btn {
                            display: inline-block;
                            padding: 10px 20px;
                            margin-top: 15px;
                            color: #fff;
                            background-color: #4CAF50;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                        .btn:hover {
                            background-color: #45a049;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Notification of Access Permission Update</h1>
                        <p>Dear ${user},</p>
                        <p>We are pleased to inform you that your account has been updated with new access permissions as follows:</p>
                        <ul>
                            <li><strong>Role:</strong> ${newRole}</li>
                            <li><strong>Effective Date:</strong> ${new Date()}</li>
                        </ul>
                        <p>This change enables you to access new features and resources necessary for your role. Please ensure you review your new access rights and responsibilities.</p>
                        <p>If you encounter any issues or have questions, feel free to contact the IT support team or your supervisor for assistance.</p>
                        <p>Best regards,</p>
                        <p>${admin}<br>${role}<br>Build My Dreams</p>
                    </div>
                </body>
            </html>`,
  };
}
//<p>Please change your password upon your first login for security purposes.</p>
//<a href="[company_login_url]" class="button">Login to Your Account</a>
module.exports = SendNotifyMakeAdmin;
