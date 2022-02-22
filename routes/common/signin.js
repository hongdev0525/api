const express = require("express");
const router = express.Router();
const axios = require("axios");
const mariaDB = require("../../database/connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authPhone = require("../../public/javascripts/auth_phone");
require("dotenv").config();

const INQUIRY_SECRET = "12inquiryId%^89";

router.get("/", (req, res, next) => {
  res.send("conneted");
});

router.post("/setNewpwd", (req, res, next) => {
  const userId = req.body.userId;
  let userPassword = req.body.userPassword;
  mariaDB.query(
    `SELECT UserSecretKey FROM UserMst WHERE UserId ="${userId}"`,
    (err, rows) => {
      console.log(bcrypt.compareSync(userPassword, rows[0].UserSecretKey));
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

router.get("/idCheck", (req, res, next) => {
  mariaDB.query(
    `SELECT UserID FROM UserMst where UserID = "${req.query.userId}"`,
    (err, rows) => {
      if (!err) {
        console.log(rows);
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

router.post("/idInquiry", (req, res, next) => {
  const inquiryToken = req.body.inquiryToken;
  if (jwt.verify(inquiryToken, INQUIRY_SECRET)) {
    console.log(req.body.userName, req.body.userPhone);
    mariaDB.query(
      `SELECT UserID FROM UserMst WHERE UserName = "${req.body
        .userName}" AND UserPhone = "${req.body.userPhone}"`,
      (err, rows) => {
        if (!err) {
          if (rows.length !== 0) {
            console.log(rows[0].UserID);
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

router.post("/phone", (req, res, next) => {
  mariaDB.query(
    `SELECT * from UserMst WHERE UserPhone = "${req.body.userPhone}" `,
    (err, rows) => {
      if (!err) {
        const userPhoneNumber = req.body.userPhone;
        const userName = req.body.userName;
        authPhone(userPhoneNumber, userName)
          .then(respones => {
            res.send({
              status: "success",
              authNumber: respones,
              inquiryToken: jwt.sign(
                {
                  id: userName,
                  role: userPhoneNumber
                },
                INQUIRY_SECRET,
                {
                  algorithm: "HS256",
                  expiresIn: "5M"
                }
              )
            });
          })
          .catch(err => {
            console.log("err", err);
            res.send(err);
          });
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
