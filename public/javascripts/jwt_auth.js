const jwt = require("./jwt_util");

//jwt 인증 미들웨어 : 엑세스 토큰이 여부확인후 재발급 혹은 로그아웃
const authJWT = (req, res, next) => {
  if (req.body.access_token) {
    next();
  } else {
    if (req.cookies) {
      const verfiyActk = jwt.verify(req.cookies.actk);
      const verfiyRftk = jwt.verify(req.cookies.rftk);
      if (verfiyActk.status === "success") {
        if (verfiyRftk.status === "success") {
          next();
        } else {
          jwt.destroy(req.cookies.rftk);
          res.send({ status: "logOut" });
        }
      } else {
        if (
          verfiyActk.message === "jwt expired" &&
          verfiyRftk.status === "success"
        ) {
          jwt.destroy(req.cookies.actk);
          res.cookie(
            "actk",
            jwt.sign({
              id: verfiyRftk.id,
              role: verfiyRftk.role
            }),
            {
              path: "/",
              httpOnly: true
            }
          );
          next();
        } else {
          jwt.destroy(req.cookies.rftk);
          jwt.destroy(req.cookies.actk);
          res.send({ status: "logOut", message: "All jwt is destroyed" });
        }
      }
    }
  }
};

module.exports = authJWT;
