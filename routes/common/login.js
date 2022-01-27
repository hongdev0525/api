const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mariaDB = require("../../database/connect");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const jwt = require("../../public/javascripts/jwt_util");
/* GET home page. */
router.use(cookieParser());
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
            role: "cueat-user"
          };
          const accessToken = jwt.sign(user);
          const refreshToken = jwt.refresh(user);
          res.cookie("actk", accessToken, {
            path: "/",
            httpOnly: true
          });
          res.cookie("rftk", refreshToken, {
            path: "/",
            httpOnly: true
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

router.get("/test", (req, res) => {
  mariaDB.query("SELECT * FROM UserMst ", (err, rows) => {
    if (!err) {
      res.send({ data: rows });
    } else {
      console.log(err.message);
    }
  });
});

router.post("/kakao", function(req, res) {
  // const userID = req.body.id;
  // const connectedAt = req.body.connected_at;
  // const userType = req.body.login_type;
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
              role: rows[0].UserType
            };
            const accessToken = jwt.sign(user);
            const refreshToken = jwt.refresh(user);
            res.cookie("actk", accessToken, {
              path: "/",
              httpOnly: true
            });
            res.cookie("rftk", refreshToken, {
              path: "/",
              httpOnly: true
            });
            res.status(200).send({
              status: "success"
            });
          } else {
            res.send({
              status: "signIn"
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
      status: "signIn"
    });
  }
});

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
