const croptoJS = require("crypto-js");
const axios = require("axios");

const authPhone = async (userPhoneNumber, userName) => {
  const authNumber = Math.floor(Math.random() * 899999 + 100000);
  const DATE = Date.now().toString();
  const SERVICE_ID = process.env.SENS_SMS_SERVICE_ID;
  const SECRET_KEY = process.env.NCP_SECRET_KEY;
  const ACCESS_KEY = process.env.NCP_ACCESS_KEY;
  const METHOD = "POST";
  const SPACE = " ";
  const NEWLINE = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${SERVICE_ID}/messages`;
  const url2 = `/sms/v2/services/${SERVICE_ID}/messages`;
  const hmac = croptoJS.algo.HMAC.create(croptoJS.algo.SHA256, SECRET_KEY);

  hmac.update(METHOD);
  hmac.update(SPACE);
  hmac.update(url2);
  hmac.update(NEWLINE);
  hmac.update(DATE);
  hmac.update(NEWLINE);
  hmac.update(ACCESS_KEY);
  const hash = hmac.finalize();
  const signature = hash.toString(croptoJS.enc.Base64);
  await axios({
    method: METHOD,
    url: url,
    headers: {
      "Contenc-type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": DATE,
      "x-ncp-iam-access-key": ACCESS_KEY,
      "x-ncp-apigw-signature-v2": signature,
    },
    data: {
      type: "SMS",
      countryCode: "82",
      subject: "큐잇 회원가입",
      content: `[큐잇 회원가입]${userName}님 인증번호는 [${authNumber}]를 입력해주세요.`,
      from: "07041666077",
      messages: [
        {
          to: userPhoneNumber,
        },
      ],
    },
  });
  return authNumber;
};

module.exports = authPhone;
