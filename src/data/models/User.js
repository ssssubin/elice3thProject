const mongoose = require("mongoose");

const { userSchema } = require("../schemas");

module.exports = mongoose.model("users", userSchema);
