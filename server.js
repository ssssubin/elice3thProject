require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const app = require("./src/app");
const client = require("./src/MQTT");

mongoose.connect(process.env.EC2_MONGODB_URI);

mongoose.connection.on("connected", () => {
     console.log("DB와 연결되었습니다😉");
});

mongoose.connection.on("disconnected", () => {
     console.log("DB와 연결이 끊어졌습니다🥲");
});

mongoose.connection.on("error", (err) => {
     console.log("DB와 연결하는 과정에서 에러가 발생했습니다⚠️");
     console.error(err);
});

app.listen(3000, () => {
     console.log("Port 3000과 연결되었습니다🐰");
});
