const mongoose = require("mongoose");

const { graphDataSchema } = require("../schemas");

module.exports = mongoose.model("graph_data", graphDataSchema);
