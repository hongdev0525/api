const express = require("express");
require("dotenv").config();
const router = express.Router();
const mariaDB = require("../../database/connect");
const cookieParser = require("cookie-parser");

const jwt = require("../../public/javascripts/jwt_util");
/* GET home page. */
router.get("/", function(req, res, next) {
  res.status(404);
});
router.use(cookieParser());

router.get("/test", (req, res) => {
  mariaDB.query("SELECT * FROM UserMst ", (err, rows) => {
    if (!err) {
      res.send({ data: rows });
    } else {
      console.log(err.message);
    }
  });
});

router.post("/check", function(req, res) {
  const userID = req.body.id;
  // const connectedAt = req.body.connected_at;
  const userType = req.body.login_type;
  const kakaoAccessToken = req.body.access_token;
  if (kakaoAccessToken) {
    mariaDB.query(
      `SELECT * FROM UserMst where UserID =${userID} `,
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
