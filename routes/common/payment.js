const express = require("express");
const router = express.Router();
const axios = require("axios");
// const mariaDB = require("../../database/connet");
require("dotenv").config();

/* Token for payment
  1. 아임포트 키값과 시크릿키값을 통해 authorization에 필요한 token 발급
*/
const getUserToken = async () => {
  try {
    const response = await axios({
      method: "post",
      url: "https://api.iamport.kr/users/getToken",
      data: {
        imp_key: process.env.IAMPORT_KEY,
        imp_secret: process.env.IAMPORT_SECRET,
      },
    });
    return response.data.response.access_token;
  } catch (error) {
    console.log("fail to get userToken", error.message);
  }
};

/* Request Kakao Payment
  1. 결제 종류(일반결제, 정기결제)에 따라 각 url에 결제 요청
  2. 결제를 위해 발급받은 token은 header에 포함
*/
const ProcKakaoPay = async (orderInfo, token, url) => {
  try {
    return await axios({
      method: "post",
      url: url,
      headers: {
        Authorization: token,
      },
      data: orderInfo,
    });
  } catch (error) {
    console.log("payment error:", error);
  }
};

/* KakaoPay API
  1. 결제에 필요한 유저 토큰 발급
  2. 토큰 발행이 정상적으로 이루어지면 결제 요청
*/
router.post("/kakao", async (req, res) => {
  const url = req.body.url;
  const orderInfo = req.body.orderInfo;

  try {
    const token = await getUserToken();
    if (token) {
      const response = await ProcKakaoPay(orderInfo, token, url);
      console.log("payment response: ", response);
      res.send({
        data: response.data.response,
        success: true,
        message: "payment success",
      });
    }
  } catch (error) {
    console.log("ERROR:", error.message);
  }
});

module.exports = router;
