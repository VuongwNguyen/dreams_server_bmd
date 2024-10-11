function GetVerifyCode(code, mail) {
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: "Verify code",
    html: ` <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="padding: 20px; background-color: #0CBBF0; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px;">Your OTP Code</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 40px; text-align: center;">
                <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">
                  Hi, <span style="font-weight:bold">${
                    mail.split("@")[0]
                  }</span> we received a request to access your account. Please use the OTP code below to complete your verification process.
                </p>
                <div style="display: inline-block; background-color: #0CBBF0; padding: 15px 30px; border-radius: 8px; margin-bottom: 20px;">
                  <span style="font-size: 24px; color: #ffffff; letter-spacing: 4px;">${code}</span> <!-- Replace this with actual OTP -->
                </div>
                <p style="font-size: 16px; color: #333333;">
                  This OTP is valid for the next 10 minutes. If you didn’t request this, please ignore this email or contact support.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px; background-color: #f4f4f4; text-align: center; color: #333333;">
                <p style="font-size: 12px; margin: 0;">
                  If you have any questions, feel free to reach out to our support team.
                </p>
                <p style="font-size: 12px; margin: 5px 0 0;">
                  © 2024 Dreams app. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>`,
  };
}

module.exports = GetVerifyCode;
