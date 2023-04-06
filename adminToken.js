const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies["permission"];

  if (!token) {
    return res.status(401).json({ err: "Permission denied" });
  }
  try {
    const verify = jwt.verify(token, process.env.Token_Secret);
    req.user = verify;
    next();
  } catch (err) {
    res.status(400).send("Ivalid Token");
  }
};
