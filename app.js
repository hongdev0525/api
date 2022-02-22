const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const indexRouter = require("./routes/index");
const loginRouter = require("./routes/common/login");
const smsRouter = require("./routes/common/sms");
const signRouter = require("./routes/common/signin");
const paymentRouter = require("./routes/common/payment");
const jwtAuth = require("./public/javascripts/jwt_auth");
const mariaDB = require("./database/connect");
const app = express();

/** 모든 API 통신에 미들웨어로 jwtAuth를 넣어줘야한다. */

//DB connetion
mariaDB.connect();

//CORS policy
const CORS_OPTION = {
  origin: "http://localhost",
  credentials: true,
};

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//Set middleware
app.use(logger("dev"));
app.use(cors(CORS_OPTION));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//Set route
app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/sms", smsRouter);
app.use("/signin", signRouter);
app.use("/payment", paymentRouter);

//enable pre-flight across-the-board
// app.options("*", cors());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
