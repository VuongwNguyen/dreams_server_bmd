function GetVerifyCode(code, mail) {
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: "Verify code",
    html: `<h1>Your verify code is: ${code}</h1>`,
  };
}

module.exports = GetVerifyCode;
