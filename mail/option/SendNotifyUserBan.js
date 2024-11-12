function SendNotifyUserBan({ mail, reason, duration }) {
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: "Welcome to the Company - Your Account Details",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Suspension Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 24px;
            color: #d9534f;
            margin-bottom: 20px;
        }
        p {
            margin: 10px 0;
            font-size: 16px;
        }
        .footer {
            font-size: 12px;
            color: #777777;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Account Suspension Notification</h1>
        <p>Dear User, ${mail.split("@")[0]}</p>
        <p>We would like to inform you that your account has been temporarily suspended due to the following reason:</p>
        <p><strong>Reason:</strong> [Insert specific reason for suspension]</p>
        <p><strong>Suspension Duration:</strong> [Insert suspension duration]</p>
        <p>If you believe this is a mistake or need further assistance, please contact our support team.</p>
        <p>We are committed to resolving your issue as soon as possible.</p>
        <p>Best regards,</p>
        <p>The Support Team <br> Dreams app</p>
        <div class="footer">
            <p>© 2024 Dreams app. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`,
  };
}
//<p>Please change your password upon your first login for security purposes.</p>
//<a href="[company_login_url]" class="button">Login to Your Account</a>
module.exports = SendNotifyUserBan;
