const { Schema } = require("mongoose");

const graphDataSchema = new Schema(
     {
          email: {
               type: String,
               required: true,
          },
          deviceId: {
               type: String,
               required: true,
          },
          deviceName: {
               type: String,
               required: true,
          },
          plantName: {
               type: String,
               required: true,
          },
          temperature: {
               type: Number,
               required: true,
          },
          humidity: {
               type: Number,
               required: true,
          },
          soilMoisture: {
               type: Number,
               required: true,
          },
          time: {
               type: Date,
               default: Date.now,
          },
     },
     {
          versionKey: false,
     }
);

module.exports = graphDataSchema;
