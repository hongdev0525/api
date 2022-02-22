const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mariaDB = require("../../database/connect");
const cookieParser = require("cookie-parser");
const jwt = require("../../public/javascripts/jwt_util");
require("dotenv").config();

/* GET home page. */
router.use(cookieParser());

/* Login API
  1. 유저 아이디를 통해 비밀번호 검색
  2. bcrypt를 통해 비밀번호 일치 여부 확인
  3. 일치하면 access token과 refresh token을 발급하고 로그인 시킴
*/
router.post("/", (req, res, next) => {
  const userId = req.body["user-id"];
  const userPassword = req.body["user-password"];
  const query = `SELECT UserSecretKey FROM UserMst WHERE UserID = "${userId}" `;

  mariaDB.query(query, (err, rows) => {
    if (!err) {
      if (rows.length !== 0) {
        if (bcrypt.compareSync(userPassword, rows[0].UserSecretKey)) {
          console.log("password correct");
          const user = {
            id: userId,
            role: "cueat-user",
          };
          const accessToken = jwt.sign(user);
          const refreshToken = jwt.refresh(user);
          res.cookie("actk", accessToken, {
            path: "/",
            httpOnly: true,
          });
          res.cookie("rftk", refreshToken, {
            path: "/",
            httpOnly: true,
          });
          res.status(200).send({ status: "success", message: "login success" });
        } else {
          res.send({ status: "fail", error: "wrong password" });
        }
      } else {
        res.send({ status: "fail", error: "not found" });
      }
    } else {
      res.send({ status: "fail", error: "sql error" });
    }
  });
});

/* Kakao Login
  1. 카카오 로그인에서 발행한 access token 유무를 확인함.
  2. 이메일을 통해 유저 정보를 획득
  3. 유저정보가 존재하면 access toekn과 refresh token을 발급하고 로그인시킴.
  4. 만약 유저 정보가 없다면 회원가입으로 전환
*/
router.post("/kakao", function (req, res) {
  const userEmail = req.body.email;
  const kakaoAccessToken = req.body.access_token;

  if (kakaoAccessToken) {
    mariaDB.query(
      `SELECT * FROM UserMst where UserEmail = "${userEmail}" `,
      (err, rows) => {
        if (!err) {
          if (rows.length !== 0) {
            const user = {
              id: rows[0].UserEmail,
              role: rows[0].UserType,
            };
            res.cookie("actk", jwt.sign(user), {
              path: "/",
              httpOnly: true,
            });
            res.cookie("rftk", jwt.refresh(user), {
              path: "/",
              httpOnly: true,
            });
            res.status(200).send({
              status: "success",
            });
          } else {
            res.send({
              status: "signIn",
            });
          }
        } else {
          console.log(err);
        }
      }
    );
  } else {
    console.log("No access token so redirect to login page");
    res.send({
      status: "signIn",
    });
  }
});

/* Log Out
  1. access token 과 refresh token을 제거
*/
router.get("/logout", (req, res) => {
  try {
    res.clearCookie("rftk");
    res.clearCookie("actk");
    res.status(200).send({ status: "logOut" });
  } catch (e) {
    res.send({ status: "fail" });
  }
});

module.exports = router;
