const { Schema } = require("mongoose");

const defaultDataSchema = new Schema(
     {
          email: {
               type: String,
               required: true,
          },
          deviceId: {
               type: String,
               required: true,
               immutable: true, // 값 변경할 수 없도록
          },
          deviceName: {
               type: String,
               required: true,
               immutable: true,
          },
          plantName: {
               type: String,
               required: true,
          },
          minTemperature: {
               type: Number,
               required: true,
          },
          maxTemperature: {
               type: Number,
               required: true,
          },
          minHumidity: {
               type: Number,
               required: true,
          },
          maxHumidity: {
               type: Number,
               required: true,
          },
          minSoilMoisture: {
               type: Number,
               required: true,
          },
          maxSoilMoisture: {
               type: Number,
               required: true,
          },
     },
     {
          versionKey: false,
     }
);

module.exports = defaultDataSchema;
