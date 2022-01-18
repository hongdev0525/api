const express = require("express");
const axios = require("axios");
const croptoJS = require("crypto-js");
const router = express.Router();
require("dotenv").config();

router.get("/", async function(req, res, next) {
  //   const user_phone_number = req.phone_number;
  //   const user_name = req.phone_number;

  //   const ERR_CODE = 404;
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
      "x-ncp-apigw-signature-v2": signature
    },
    data: {
      type: "SMS",
      countryCode: "82",
      subject: "큐잇 SMS 문자발송",
      content:
        "홍의현입니다. 큐잇 SMS 문자 발송 테스트입니다. 이 문자는 SMS api에 의해 발송 되었으며 문자가 정상적으로 수신됐다면 기능이 정상작동함을 알려드립니다.",
      from: "07041666077",
      messages: [
        {
          to: "01082487509"
        }
      ]
    }
  })
    .then(response => {
      res.send({ status: "success", res: response });
    })
    .catch(err => {
      console.log("err", err);
      res.send(err);
    });
});

module.exports = router;
