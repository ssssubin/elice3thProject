const mongoose = require("mongoose");

const { defaultDataSchema } = require("../schemas");

module.exports = mongoose.model("default_data", defaultDataSchema);
