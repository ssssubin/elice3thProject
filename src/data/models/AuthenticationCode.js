const mongoose = require("mongoose");

const { authenticationCodeSchema } = require("../schemas");

module.exports = mongoose.model("authentication_codes", authenticationCodeSchema);
