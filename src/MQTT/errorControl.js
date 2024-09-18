const nodemailer = require("nodemailer");
const { DefaultData } = require("../data");

// Nodemailer 설정
const transporter = nodemailer.createTransport({
     service: "gmail", // 사용하고자 하는 이메일 서비스 제공자 (예: Gmail)
     auth: {
          user: process.env.EMAIL_USER, // 보내는 사람 이메일 주소
          pass: process.env.EMAIL_PASSWORD, // 보내는 사람 이메일 비밀번호
     },
});

const temperatureErrorTopic = "dt/farm/house/temperature/warning";
const humidityErrorTopic = "dt/farm/house/humidity/warning";
const soilMoistureErrorTopic = "dt/farm/house/soilMoisture/warning";

const errorControl = async (topic, message) => {
     // 온도, 습도, 지습 에러 토픽으로 들어왔을 경우에만 메일 보냄
     if (topic === temperatureErrorTopic || topic === humidityErrorTopic || topic === soilMoistureErrorTopic) {
          const data = JSON.parse(message.toString());
          const { deviceId, attribute, exceed } = data;
          const foundDevice = await DefaultData.findOne({ deviceId }).lean();

          const datas = {
               temperature: "온도",
               humidity: "습도",
               soilMoisture: "지습",
          };

          const range = {
               1: "초과",
               0: "미만",
          };
          const mail_data = {
               from: process.env.EMAIL_USER,
               to: foundDevice.email,
               subject: `[smartFarm] ${datas[attribute]} 이상이 발생했습니다.`,
               text: `[smartFarm] ${datas[attribute]}(이)가 ${range[exceed]}입니다.`,
          };

          transporter.sendMail(mail_data, (error, info) => {
               if (error) {
                    console.error(error);
                    const err = new Error("메일 전송에 실패했습니다.");
                    err.statusCode = 500;
                    throw err;
               }
          });
     }
};

module.exports = errorControl;
