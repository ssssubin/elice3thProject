const mqtt = require("mqtt");
const client = mqtt.connect(process.env.MQTT_SERVER);
const errorControl = require("./errorControl");
const graphData = require("./graphData");

// 온도,습도,지습 에러 토픽구독
const temperatureErrorTopic = "dt/farm/house/temperature/warning";
const humidityErrorTopic = "dt/farm/house/humidity/warning";
const soilMoistureErrorTopic = "dt/farm/house/soilMoisture/warning";
const graphTopic = "dt/farm/house/graph";
const realTimeTopic = "dt/farm/house/realtime";

client.on("connect", () => {
     console.log("MQTT와 연결되었습니다.😊");
     client.subscribe(temperatureErrorTopic, { qos: 1 });
     client.subscribe(humidityErrorTopic, { qos: 1 });
     client.subscribe(soilMoistureErrorTopic, { qos: 1 });
     client.subscribe(graphTopic, { qos: 1 });
     client.subscribe(realTimeTopic, { qos: 1 });
});

client.on("disconnect", () => {
     console.log("MQTT와 연결이 끊어졌습니다.🥲");
});

client.on("error", (err) => {
     console.log("MQTT와 연결하는 과정에서 오류가 발생하였습니다.⚠️");
     console.error(err);
});

client.on("reconnect", () => {
     console.log("MQTT와 재연결되었습니다.😊");
     client.subscribe(temperatureErrorTopic, { qos: 1 });
     client.subscribe(humidityErrorTopic, { qos: 1 });
     client.subscribe(soilMoistureErrorTopic, { qos: 1 });
     client.subscribe(graphTopic, { qos: 1 });
     client.subscribe(realTimeTopic, { qos: 1 });
});

client.on("message", errorControl);

client.on("message", graphData);

module.exports = client;
