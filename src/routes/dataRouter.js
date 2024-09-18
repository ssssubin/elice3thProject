const router = require("express").Router();
const { DefaultData, GraphData, User } = require("../data");
const client = require("../MQTT");

// 온도,습도,지습 토픽
const temperatureTopic = "farm/house/temperature";
const humidityTopic = "farm/house/humidity";
const soilMoistureTopic = "farm/house/soilMoisture";
/**
 * @swagger
 * tags:
 *   name: Data
 *   description: 데이터 API
 * /data/default:
 *   post:
 *     summary: 초기 데이터 생성
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/data"
 *     responses:
 *       201:
 *         description: 초기 데이터 생성
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   $ref: "#/components/schemas/data"
 *             example:
 *               deviceId: 001122AABBCC
 *               deviceName: 기기1
 *               plantName: 방울토마토
 *               minTemperature: 10
 *               maxTemperature: 34
 *               minHumidity: 10
 *               maxHumidity: 56
 *               minSoilMoisture: 43
 *               maxSoilMoisture: 68
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기Id는 문자열이며 빈 값이 될 수 없습니다.
 *                  | 기기 id는 12글자이어야 합니다.
 *                  | 기기명은 문자열이며 빈 값이 될 수 없습니다.
 *                  | 이미 존재하는 기기입니다. 다른 이름으로 설정해주세요.
 *                  | 식물 이름은 문자열이며 빈 값이 될 수 없습니다.
 *                  | 최저 온도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 온도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최저 습도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 습도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최저 지습은 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 지습은 숫자이며 빈 값이 될 수 없습니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                  | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기에 온도 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 습도 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 지습 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *               data: null
 */
// 초기데이터 생성
router.post("/default", async (req, res, next) => {
     try {
          const {
               deviceId,
               deviceName,
               plantName,
               minTemperature,
               maxTemperature,
               minHumidity,
               maxHumidity,
               minSoilMoisture,
               maxSoilMoisture,
          } = req.body;

          const email = res.locals.user.email;

          // 기기 ID가 문자열이 아니거나 빈 값이 경우
          if (typeof deviceId !== "string" || deviceId.trim() === "") {
               const err = new Error("기기 ID는 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          if (deviceId.length !== 12) {
               const err = new Error("기기 ID는 12글자이어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 입력 받은 기기 ID가 DB에 존재하는 경우
          const foundDevice = await DefaultData.findOne({ email, deviceId }).lean();
          if (foundDevice) {
               const err = new Error("이미 존재하는 기기입니다. 다시 확인해주세요.");
               err.statusCode = 400;
               return next(err);
          }

          // 기기 이름이 문자열이 아니거나 빈 값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 기기 이름이 중복되는 경우
          const distinctDevice = await DefaultData.findOne({ email, deviceName }).lean();
          if (distinctDevice) {
               const err = new Error("이미 존재하는 기기 이름입니다. 다른 이름으로 설정해주세요");
               err.statusCode = 400;
               return next(err);
          }

          // 식물 이름이 문자열이 아니거나 빈 값인 경우
          if (typeof plantName !== "string" || plantName.trim() === "") {
               const err = new Error("식물 이름은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최저 온도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minTemperature))) {
               const err = new Error("최저 온도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 온도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxTemperature))) {
               const err = new Error("최대 온도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최소 습도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minHumidity))) {
               const err = new Error("최소 습도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 습도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxHumidity))) {
               const err = new Error("최대 습도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최소 지습이 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minSoilMoisture))) {
               const err = new Error("최소 지습은 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 지습이 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxSoilMoisture))) {
               const err = new Error("최대 지습은 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 디바이스에게 전송할 메시지
          const temperatureData = {
               userEmail: email,
               minTemperature,
               maxTemperature,
          };

          const humidityData = {
               userEmail: email,
               minHumidity,
               maxHumidity,
          };

          const soilMoistureData = {
               userEmail: email,
               minSoilMoisture,
               maxSoilMoisture,
          };

          const errors = await Promise.all([
               // 디바이스에게 온도 데이터 전송
               client.publishAsync(temperatureTopic, JSON.stringify(temperatureData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 온도 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),
               // 디바이스에게 습도 데이터 전송
               client.publishAsync(humidityTopic, JSON.stringify(humidityData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 습도 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),

               // 디바이스에게 지습 데이터 전송
               client.publishAsync(soilMoistureTopic, JSON.stringify(soilMoistureData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 지습 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),
          ]);

          // 전송하는 과정에서 에러가 발생했을 경우
          const publishError = errors.some((err) => err instanceof Error);

          if (publishError) {
               // AggregateError: 여러 개의 에러를 하나로 합치는데 사용하는 error class. JS의 기본 클래스이다.
               const aggregatedError = new AggregateError(
                    errors,
                    "기기에 데이터를 전송하는 과정에서 오류가 발생하였습니다"
               );
               aggregatedError.statusCode = 500;
               next(aggregatedError);
          }

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          await DefaultData.create({
               email,
               deviceId: deviceId.toUpperCase(),
               deviceName,
               plantName,
               minTemperature,
               maxTemperature,
               minHumidity,
               maxHumidity,
               minSoilMoisture,
               maxSoilMoisture,
          });

          res.status(201).json({
               err: null,
               data: {
                    deviceId: deviceId.toUpperCase(),
                    deviceName,
                    plantName,
                    minTemperature: Number.parseFloat(minTemperature),
                    maxTemperature: Number.parseFloat(maxTemperature),
                    minHumidity: Number.parseFloat(minHumidity),
                    maxHumidity: Number.parseFloat(maxHumidity),
                    minSoilMoisture: Number.parseFloat(minSoilMoisture),
                    maxSoilMoisture: Number.parseFloat(maxSoilMoisture),
               },
          });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /data/default/{deviceName}:
 *   put:
 *     summary: 초기 데이터 변경
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 데이터를 변경하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/data"
 *     responses:
 *       200:
 *         description: 데이터 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceName:
 *                       type: string
 *                       example: 기기1
 *                     minTemperature:
 *                       type: float
 *                       example: 10
 *                     maxTemperature:
 *                       type: float
 *                       example: 25
 *                     minHumidity:
 *                       type: float
 *                       example: 20
 *                     maxHumidity:
 *                       type: float
 *                       example: 67
 *                     minSoilMoisture:
 *                       type: float
 *                       example: 34
 *                     maxSoilMoisture:
 *                       type: float
 *                       example: 76
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기Id는 문자열이며 빈 값이 될 수 없습니다.
 *                  | 기기 id는 12글자이어야 합니다.
 *                  | 기기명은 문자열이며 빈 값이 될 수 없습니다.
 *                  | 이미 존재하는 기기입니다. 다른 이름으로 설정해주세요.
 *                  | 식물 이름은 문자열이며 빈 값이 될 수 없습니다.
 *                  | 최저 온도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 온도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최저 습도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 습도는 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최저 지습은 숫자이며 빈 값이 될 수 없습니다.
 *                  | 최고 지습은 숫자이며 빈 값이 될 수 없습니다.
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *              err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                 | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *              data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기에 온도 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 습도 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 지습 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *                  | 기기에 데이터를 전송하는 과정에서 오류가 발생하였습니다.
 *               data: null
 */
// 초기 데이터 변경
router.put("/default/:deviceName", async (req, res, next) => {
     try {
          const { deviceName } = req.params;
          const {
               plantName,
               minTemperature,
               maxTemperature,
               minHumidity,
               maxHumidity,
               minSoilMoisture,
               maxSoilMoisture,
          } = req.body;
          const email = res.locals.user.email;

          // params로 받은 기기명이 문자열이 아니거나 빈 값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // params로 받은 기기명이 db에 존재하지 않는 경우
          const foundDevice = await DefaultData.findOne({ email, deviceName });
          if (foundDevice === null || foundDevice === undefined) {
               const err = new Error("존재하지 않는 기기입니다.");
               err.statusCode = 400;
               return next(err);
          }

          const temperatureModifyTopic = `${temperatureTopic}/modify`;
          const humidityModifyTopic = `${humidityTopic}/modify`;
          const soilMoistureModifyTopic = `${soilMoistureTopic}/modify`;

          // 식물 이름이 문자열이 아니거나 빈 값인 경우
          if (typeof plantName !== "string" || plantName.trim() === "") {
               const err = new Error("식물 이름은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최저 온도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minTemperature))) {
               const err = new Error("최저 온도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 온도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxTemperature))) {
               const err = new Error("최대 온도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최소 습도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minHumidity))) {
               const err = new Error("최소 습도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 습도가 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxHumidity))) {
               const err = new Error("최대 습도는 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최소 지습이 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(minSoilMoisture))) {
               const err = new Error("최소 지습은 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 최대 지습이 숫자(실수형)가 아니며 빈 값인 경우
          if (Number.isNaN(Number.parseFloat(maxSoilMoisture))) {
               const err = new Error("최대 지습은 실수형이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 디바이스에게 전송할 메시지
          const temperatureData = {
               minTemperature,
               maxTemperature,
          };

          const humidityData = {
               minHumidity,
               maxHumidity,
          };

          const soilMoistureData = {
               minSoilMoisture,
               maxSoilMoisture,
          };

          const errors = await Promise.all([
               // 디바이스에게 온도 데이터 전송
               client.publishAsync(temperatureModifyTopic, JSON.stringify(temperatureData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 온도 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),
               // 디바이스에게 습도 데이터 전송
               client.publishAsync(humidityModifyTopic, JSON.stringify(humidityData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 습도 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),

               // 디바이스에게 지습 데이터 전송
               client.publishAsync(soilMoistureModifyTopic, JSON.stringify(soilMoistureData), { qos: 1 }).catch((e) => {
                    // puback 못 받은 경우 에러
                    console.error(e);
                    return new Error("기기에 지습 데이터를 전송하는 과정에서 오류가 발생하였습니다.");
               }),
          ]);

          // 전송하는 과정에서 에러가 발생했을 경우
          const publishError = errors.some((err) => err instanceof Error);

          if (publishError) {
               // AggregateError: 여러 개의 에러를 하나로 합치는데 사용하는 error class. JS의 기본 클래스
               const aggregatedError = new AggregateError(
                    errors,
                    "기기에 데이터를 전송하는 과정에서 오류가 발생하였습니다"
               );
               aggregatedError.statusCode = 500;
               next(aggregatedError);
          }

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          const updateData = await DefaultData.updateOne(
               { deviceId: foundDevice.deviceId },
               {
                    plantName,
                    minTemperature,
                    maxTemperature,
                    minHumidity,
                    maxHumidity,
                    minSoilMoisture,
                    maxSoilMoisture,
               }
          );

          // DB에 업데이트가 제대로 이루어지지 않았을 경우
          if (updateData.modifiedCount === 0) {
               const err = new Error("수정한 데이터를 업데이트 하는 과정에서 오류가 발생했습니다.");
               err.statusCode = 500;
               return next(err);
          }

          res.status(200).json({
               err: null,
               data: {
                    plantName,
                    minTemperature: Number.parseFloat(minTemperature),
                    maxTemperature: Number.parseFloat(maxTemperature),
                    minHumidity: Number.parseFloat(minHumidity),
                    maxHumidity: Number.parseFloat(maxHumidity),
                    minSoilMoisture: Number.parseFloat(minSoilMoisture),
                    maxSoilMoisture: Number.parseFloat(maxSoilMoisture),
               },
          });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /data/graph/temperature/{deviceName}:
 *   get:
 *     summary: 온도 그래프 데이터 가져오기
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 온도 그래프 데이터가 필요한 기기명
 *     responses:
 *       200:
 *         description: 온도 그래프 데이터 가져오기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     dayAgoTemperatures:
 *                       type: date
 *                     weekAgoTemperatures:
 *                       type: date
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                  | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 존재하지 않는 기기입니다.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
// 하루치와 일주일치 온도데이터 조회
router.get("/graph/temperature/:deviceName", async (req, res, next) => {
     const { deviceName } = req.params;

     const foundData = await GraphData.findOne({ email: res.locals.user.email, deviceName }).lean();
     const currentTime = new Date(); // 요청이 들어온 시간(UTC)
     const weekAgo = new Date(currentTime - 86400000 * 7); // 일주일 전

     const startOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate() - 1
     ).getTime(); // 어제의 시작
     const endOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate()
     ).getTime(); // 어제의 끝

     // 기기명이 문자열이 아니거나 빈 값인 경우
     // params로 받은 기기명이 문자열이 아니거나 빈 값인 경우
     if (typeof deviceName !== "string" || deviceName.trim() === "") {
          const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
          err.statusCode = 400;
          return next(err);
     }

     // params로 받은 기기명이 db에 존재하지 않는 경우
     if (foundData === null || foundData === undefined) {
          const err = new Error("존재하지 않는 기기입니다.");
          err.statusCode = 404;
          return next(err);
     }

     // 일주일치 데이터(요청한 날짜를 기준으로 일주일 전까지의 데이터)
     const weekAgoData = await GraphData.find({
          email: res.locals.user.email,
          deviceName,
          time: { $gte: weekAgo, $lte: currentTime },
     });

     // 온도 데이터만 추출
     const weekAgoTemperatures = weekAgoData.map((item) => item.temperature);

     // 하루전 데이터만 추출
     const dayAgoTemperatures = weekAgoData
          .filter((item) => item.time.getTime() >= startOfYesterday && item.time.getTime() <= endOfYesterday)
          .map((item) => {
               return item.temperature;
          });

     res.status(200).json({
          err: null,
          data: {
               dayAgoTemperatures,
               weekAgoTemperatures,
          },
     });
});

/**
 * @swagger
 * /data/graph/humidity/{deviceName}:
 *   get:
 *     summary: 습도 그래프 데이터 가져오기
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 습도 그래프 데이터가 필요한 기기명
 *     responses:
 *       200:
 *         description: 습도 그래프 데이터 가져오기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     dayAgohumidity:
 *                       type: date
 *                     weekAgohumidity:
 *                       type: date
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                  | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 존재하지 않는 기기입니다.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
// 하루치와 일주일치 습도조회
router.get("/graph/humidity/:deviceName", async (req, res, next) => {
     const { deviceName } = req.params;

     const foundData = await GraphData.findOne({ email: res.locals.user.email, deviceName }).lean();
     const currentTime = new Date(); // 요청이 들어온 시간
     const weekAgo = new Date(currentTime - 86400000 * 7); // 일주일 전

     const startOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate() - 1
     ).getTime(); // 어제의 시작
     const endOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate()
     ).getTime(); // 어제의 끝

     // 기기명이 문자열이 아니거나 빈 값인 경우
     // params로 받은 기기명이 문자열이 아니거나 빈 값인 경우
     if (typeof deviceName !== "string" || deviceName.trim() === "") {
          const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
          err.statusCode = 400;
          return next(err);
     }

     // params로 받은 기기명이 db에 존재하지 않는 경우
     if (foundData === null || foundData === undefined) {
          const err = new Error("존재하지 않는 기기입니다.");
          err.statusCode = 400;
          return next(err);
     }

     // 일주일치 데이터(요청한 날짜를 기준으로 일주일 전까지의 데이터)
     const weekAgoData = await GraphData.find({
          email: res.locals.user.email,
          deviceName,
          time: { $gte: weekAgo, $lte: currentTime },
     });

     // 습도 데이터만 추출
     const weekAgohumidity = weekAgoData.map((item) => item.humidity);

     // 하루전 데이터만 추출
     const dayAgohumidity = weekAgoData
          .filter((item) => item.time.getTime() >= startOfYesterday && item.time.getTime() <= endOfYesterday)
          .map((item) => {
               return item.humidity;
          });

     res.status(200).json({
          err: null,
          data: {
               dayAgohumidity,
               weekAgohumidity,
          },
     });
});

/**
 * @swagger
 * /data/graph/soilMoisture/{deviceName}:
 *   get:
 *     summary: 지습 그래프 데이터 가져오기
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 지습 그래프 데이터가 필요한 기기명
 *     responses:
 *       200:
 *         description: 지습 그래프 데이터 가져오기 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     dayAgosoilMoisture:
 *                       type: date
 *                     weekAgosoilMoisture:
 *                       type: date
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                  | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 존재하지 않는 기기입니다.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
// 하루치와 일주일치 지습조회
router.get("/graph/soilMoisture/:deviceName", async (req, res, next) => {
     const { deviceName } = req.params;

     const foundData = await GraphData.findOne({ email: res.locals.user.email, deviceName }).lean();
     const currentTime = new Date(); // 요청이 들어온 시간
     const weekAgo = new Date(currentTime - 86400000 * 7); // 일주일 전

     const startOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate() - 1
     ).getTime(); // 어제의 시작
     const endOfYesterday = new Date(
          currentTime.getFullYear(),
          currentTime.getMonth(),
          currentTime.getDate()
     ).getTime(); // 어제의 끝

     // 기기명이 문자열이 아니거나 빈 값인 경우
     // params로 받은 기기명이 문자열이 아니거나 빈 값인 경우
     if (typeof deviceName !== "string" || deviceName.trim() === "") {
          const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
          err.statusCode = 400;
          return next(err);
     }

     // params로 받은 기기명이 db에 존재하지 않는 경우
     if (foundData === null || foundData === undefined) {
          const err = new Error("존재하지 않는 기기입니다.");
          err.statusCode = 400;
          return next(err);
     }

     // 일주일치 데이터(요청한 날짜를 기준으로 일주일 전까지의 데이터)
     const weekAgoData = await GraphData.find({
          email: res.locals.user.email,
          deviceName,
          time: { $gte: weekAgo, $lte: currentTime },
     });

     // 온도 데이터만 추출
     const weekAgosoilMoisture = weekAgoData.map((item) => item.soilMoisture);

     // 하루전 데이터만 추출
     const dayAgosoilMoisture = weekAgoData
          .filter((item) => item.time.getTime() >= startOfYesterday && item.time.getTime() <= endOfYesterday)
          .map((item) => {
               return item.soilMoisture;
          });

     res.status(200).json({
          err: null,
          data: {
               dayAgosoilMoisture,
               weekAgosoilMoisture,
          },
     });
});

module.exports = router;
