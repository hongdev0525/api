const express = require("express");
const router = express.Router();
const axios = require("axios");
const mariaDB = require("../../database/connect");
const croptoJS = require("crypto-js");
const bcrypt = require("bcrypt");
require("dotenv").config();

router.get("/", (req, res, next) => {
  res.send("conneted");
});
router.get("/id", (req, res, next) => {
  mariaDB.query(
    `SELECT UserNo FROM UserMst where UserID = "${req.query.userId}"`,
    (err, rows) => {
      if (!err) {
        console.log(rows);
        if (rows.length === 0) {
          res.status(200).send({ status: "success", data: rows[0] });
        } else {
          res.send({ status: "fail", data: "exist" });
        }
      } else {
        console.log(err);
      }
    }
  );
});

router.post("/phone", (req, res, next) => {
  mariaDB.query(
    `SELECT UserNo from UserMst WHERE UserPhone = "${req.body.userPhone}" `,
    async (err, rows) => {
      if (!err) {
        if (rows.length === 0) {
          const userPhoneNumber = req.body.userPhone;
          const userName = req.body.userName;
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
          const hmac = croptoJS.algo.HMAC.create(
            croptoJS.algo.SHA256,
            SECRET_KEY
          );

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
              subject: "큐잇 회원가입",
              content: `[큐잇 회원가입]${userName}님 인증번호는 [${authNumber}]를 입력해주세요.`,
              from: "07041666077",
              messages: [
                {
                  to: userPhoneNumber
                }
              ]
            }
          })
            .then(respones => {
              res.send({ status: "success", authNumber: authNumber });
            })
            .catch(err => {
              console.log("err", err);
              res.send(err);
            });
        } else {
          res.send({ status: "fail", error: "already exist" });
        }
      } else {
        res.send({ status: "fail", error: "query error" });
      }
    }
  );
});

router.post("/create", (req, res) => {
  const userInfo = req.body;
  const birthDay = new Date(
    `"${userInfo["user-birthDay"].substr(0, 4)}", "${userInfo[
      "user-birthDay"
    ].substr(4, 2)}" , "${userInfo["user-birthDay"].substr(6, 2)}"`
  )
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");
  const password = bcrypt.hashSync(userInfo["user-password"], 10);

  let query = `INSERT INTO UserMst (UserType, UserID,UserSecretKey , UserName, UserPhone, UserEmail, UserGender, BirthDay, StatusCode, RegDate ) VALUES ( "cueat" ,"${userInfo[
    "user-id"
  ]}" ,"${password}" , "${userInfo["user-name"]}" , "${userInfo[
    "user-phone"
  ]}", "${userInfo["user-email"]}" --[1] --[2] ,"normal", NOW())`;

  if (userInfo["user-gender"].length === 0) {
    query = query.replace("--[1]", "");
    query = query.replace("UserGender,", "");
  } else {
    query = query.replace("--[1]", `, "${userInfo["user-gender"]}"`);
  }

  if (userInfo["user-birthDay"].length === 0) {
    query = query.replace("--[2]", "");
    query = query.replace("BirthDay,", "");
  } else {
    query = query.replace("--[2]", `, "${birthDay}"`);
  }

  console.log(query);

  mariaDB.query(query, err => {
    if (!err) {
      res.send({ status: "success" });
    } else {
      console.log(err);
      res.send({ status: "fail" });
    }
  });
  //비밀번호 비교
  // 1. bcrypt.compareSync(password, encodedPassword)
  // 2. bcrypt.compare(password, encodedPassword, (err, same) => {
  // async callback
  // })
});
module.exports = router;
