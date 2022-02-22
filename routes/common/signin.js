const express = require("express");
const router = express.Router();
const axios = require("axios");
const mariaDB = require("../../database/connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authPhone = require("../../public/javascripts/auth_phone");
require("dotenv").config();

const INQUIRY_SECRET = process.env.INQUIRY_SECRET_KEY;

/*  비밀번호 비교
  1. bcrypt.compareSync(password, encodedPassword)
  2. bcrypt.compare(password, encodedPassword, (err, same) => {
  async callback
  }) */

router.get("/", (req, res) => {
  res.send("conneted");
});

/* Set New Password
  1. 유저아이디로 비밀번호 획득
  2. 기존 비밀번호와 신규 비밀번호를 비교하여 중복 확인
  3. 중복되지 않으면 신규 비밀번호 업데이트
*/
router.post("/setNewpwd", (req, res) => {
  const userId = req.body.userId;
  let userPassword = req.body.userPassword;
  mariaDB.query(
    `SELECT UserSecretKey FROM UserMst WHERE UserId ="${userId}"`,
    (err, rows) => {
      if (!err) {
        if (bcrypt.compareSync(userPassword, rows[0].UserSecretKey)) {
          res.send({ status: "fail", duplicate: true });
        } else {
          const query = `UPDATE UserMst SET UserSecretKey = "${bcrypt.hashSync(
            req.body.userPassword,
            10
          )}" WHERE UserId = "${userId}"`;
          mariaDB.query(query, (err, rows) => {
            if (!err) {
              res.send({ status: "success" });
            } else {
              res.send({ status: "fail" });
            }
          });
        }
      } else {
        console.log("password not found");
      }
    }
  );
});

/* ID Duplication Check
  1. 유저 아이디를 통해 유저 정보 획득하고 중복 여부 판단
*/
router.get("/idCheck", (req, res) => {
  mariaDB.query(
    `SELECT UserID FROM UserMst where UserID = "${req.query.userId}"`,
    (err, rows) => {
      if (!err) {
        if (rows.length !== 0) {
          res.status(200).send({ status: "success " });
        } else {
          res.send({ status: "fail", message: "not exist" });
        }
      } else {
        console.log(err);
      }
    }
  );
});

router.get("/id", (req, res) => {
  mariaDB.query(
    `SELECT UserNo FROM UserMst where UserID = "${req.query.userId}"`,
    (err, rows) => {
      if (!err) {
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

/* ID Inquiry Logic
  1. 문자인증을 통해 받은 inquiry token을 통해 재검증
  2. 유저 이름과 유저 연락처를 통해 유저 아이디 획득
*/
router.post("/idInquiry", (req, res) => {
  const inquiryToken = req.body.inquiryToken;
  if (jwt.verify(inquiryToken, INQUIRY_SECRET)) {
    mariaDB.query(
      `SELECT UserID FROM UserMst WHERE UserName = "${req.body.userName}" AND UserPhone = "${req.body.userPhone}"`,
      (err, rows) => {
        if (!err) {
          if (rows.length !== 0) {
            res.status(200).send({ status: "success", id: rows[0].UserID });
          } else {
            res.send({ status: "fail", message: "not exist" });
          }
        } else {
          console.log(err);
        }
      }
    );
  } else {
    res.send({ status: "fail", message: "invaild inquiry token" });
  }
});

/* Authorization With Phone Message
  1. 유저 연락처를 통해 유저 정보 획득
  2. 유저 정보가 확인되면 인증번호 문자 전송
  3. 인증 번호 문자 전송 후 inquiry token을 발행하여 반환
  5. inquiry token의 유효기간은 5분
*/

router.post("/phone", (req, res) => {
  const userPhoneNumber = req.body.userPhone;
  const userName = req.body.userName;

  mariaDB.query(
    `SELECT * from UserMst WHERE UserPhone = "${userPhoneNumber}" `,
    (err, rows) => {
      if (!err) {
        authPhone(userPhoneNumber, userName)
          .then((respones) => {
            res.send({
              status: "success",
              authNumber: respones,
              inquiryToken: jwt.sign(
                {
                  id: userName,
                  role: userPhoneNumber,
                },
                INQUIRY_SECRET,
                {
                  algorithm: "HS256",
                  expiresIn: "5M",
                }
              ),
            });
          })
          .catch((err) => {
            console.log("err", err);
            res.send(err);
          });
      } else {
        res.send({ status: "fail", error: "query error" });
      }
    }
  );
});

/* Create Account For User
  1. 회원 가입 정보의 각 필드를 데이터 타입에 맞게 가공
  2. 비밀번호의 경우 bcrypt를 통해 해싱 암호화 처리
  3.
*/
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

  let query = `INSERT INTO UserMst (UserType, UserID,UserSecretKey , UserName, UserPhone, UserEmail, UserGender, BirthDay, StatusCode, RegDate ) VALUES ( "cueat" ,"${userInfo["user-id"]}" ,"${password}" , "${userInfo["user-name"]}" , "${userInfo["user-phone"]}", "${userInfo["user-email"]}" --[1] --[2] ,"normal", NOW())`;

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

  mariaDB.query(query, (err) => {
    if (!err) {
      res.send({ status: "success" });
    } else {
      console.log(err);
      res.send({ status: "fail" });
    }
  });
});
module.exports = router;
