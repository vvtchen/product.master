const jwt = require("jsonwebtoken");
var { unless } = require("express-unless");

module.exports = (req, res, next) => {
  const token = req.header("auth-token") || req.cookies["auth-token"];

  if (!token) {
    return res.redirect("/login");
  }
  try {
    const verify = jwt.verify(token, process.env.Token_Secret);
    req.user = verify;
    next();
  } catch (err) {
    res.status(400).send("Ivalid Token");
  }
};

module.exports.unless = unless;
