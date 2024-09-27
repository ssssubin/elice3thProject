const { DefaultData, GraphData } = require("../data");

const graphData = async (topic, message) => {
     try {
          if (topic === "dt/farm/house/graph") {
               const data = JSON.parse(message.toString());
               const { deviceId, temperature, humidity, soilMoisture } = data;

               // 필요한 데이터가 존재하는지 확인
               if (
                    deviceId === null ||
                    deviceId === undefined ||
                    deviceId.trim() === "" ||
                    temperature === null ||
                    temperature === undefined ||
                    humidity === null ||
                    humidity === undefined ||
                    soilMoisture === null ||
                    soilMoisture === undefined
               ) {
                    const err = new Error("잘못된 데이터가 기기로부터 전송되고 있습니다.");
                    err.statusCode = 500;
                    throw err;
               }

               // 기기로부터 들어오는 데이터 타입들이 잘못된 경우
               if (
                    typeof deviceId !== "string" ||
                    Number.isNaN(Number.parseFloat(temperature)) ||
                    Number.isNaN(Number.parseFloat(humidity)) ||
                    Number.isNaN(Number.parseFloat(soilMoisture))
               ) {
                    const err = new Error("잘못된 값이 기기로부터 전송되고 있습니다.");
                    err.statusCode = 500;
                    throw err;
               }

               const foundDevice = await DefaultData.findOne({ deviceId }).lean();

               await GraphData.create({
                    email: foundDevice.email,
                    deviceId: foundDevice.deviceId,
                    deviceName: foundDevice.deviceName,
                    plantName: foundDevice.plantName,
                    temperature,
                    humidity,
                    soilMoisture,
               });
          }
     } catch (e) {
          const err = new Error("기기로부터 그래프 데이터를 가져오는데 실패했습니다.", { cause: e });
          err.statusCode = 500;
          throw err;
     }
};

module.exports = graphData;
