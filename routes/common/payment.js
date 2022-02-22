const express = require("express");
const router = express.Router();
const axios = require("axios");

const impKey = "2280369450519081";
const impSecret =
  "Sj9Zrf3HxTKSxEj6IPcFT3SCk8LvnNyg6IfyYjfvcZnJEHQmw22q6V3r3OWrBvHIdXgbgwHtv4daM3xi";
// const mariaDB = require("../../database/connet");
require("dotenv").config();

const getUserToken = async () => {
  try {
    const response = await axios({
      method: "post",
      url: "https://api.iamport.kr/users/getToken",
      data: {
        imp_key: impKey,
        imp_secret: impSecret
      }
    });
    return response.data.response.access_token;
  } catch (error) {
    console.log("fail to get userToken", error.message);
  }
};

const ProcKakaoPay = async (orderInfo, token, url) => {
  try {
    return await axios({
      method: "post",
      url: url,
      headers: {
        Authorization: token
      },
      data: orderInfo
    });
  } catch (error) {
    console.log("payment error:", error);
  }
};

router.post("/test", async (req, res) => {
  const url = req.body.url;
  const orderInfo = req.body.orderInfo;
  console.log("orderInfo", orderInfo);
  try {
    const token = await getUserToken();
    if (token) {
      const response = await ProcKakaoPay(orderInfo, token, url);
      console.log("payment response: ", response);
      res.send({
        data: response.data.response,
        success: true,
        message: "payment success"
      });
    }
  } catch (error) {
    console.log("ERROR:", error.message);
  }
});

module.exports = router;
