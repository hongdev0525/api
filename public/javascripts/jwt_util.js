const jwt = require("jsonwebtoken");

const secret = "@!cueat2356";

module.exports = {
  sign: user => {
    const payload = {
      id: user.id,
      role: user.role
    };
    return jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn: "10S"
    });
  },
  verify: token => {
    let decoded = null;
    try {
      decoded = jwt.verify(token, secret);
      return {
        status: "success",
        message: "verified",
        id: decoded.id,
        role: decoded.role
      };
    } catch (err) {
      return {
        status: "fail",
        message: err.message
      };
    }
  },
  destroy: token => {
    try {
      jwt.destroy(token);
    } catch (err) {
      return {
        status: "fail",
        message: err.message
      };
    }
  },
  refresh: user => {
    const payload = {
      id: user.id,
      role: user.role
    };
    try {
      return jwt.sign(payload, secret, {
        algorithm: "HS256",
        expiresIn: "14D"
      });
    } catch (err) {
      return {
        status: "fail",
        message: err.message
      };
    }
  },
  refreshVerify: (token, userId) => {
    //유저 테이블에서 refresh token을 가져옴
    try {
      const freshToken = "";
      if (token == freshToken) {
        try {
          jwt.verify(token, secret);
          return true;
        } catch (err) {
          return false;
        }
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }
};
