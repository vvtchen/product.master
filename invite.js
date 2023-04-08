const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    min: 6,
    max: 300,
  },
  verifyToken: {
    type: String,
  },
  status: {
    type: String,
    default: "Inviting",
  },
  company: {
    type: String,
  },
});

module.exports = mongoose.model("InviteUser", userSchema);
