const express = require("express");
const router = express.Router();
const { DefaultData } = require("../data");
const client = require("../MQTT");

/**
 * @swagger
 * tags:
 *   name: Plant
 *   description: 식물 정보 API
 * /check-plant:
 *   get:
 *     summary: 식물 정보 조회
 *     tags: [Plant]
 *     responses:
 *       200:
 *         description: 식물 정보 조회 성공
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
 *                     plantName:
 *                       type: string
 *                       example: 방울토마토
 *                     temperature:
 *                       type: number
 *                       example: 24
 *                     humidity:
 *                       type: number
 *                       example: 72
 *                     soilMoisture:
 *                       type: number
 *                       example: 56
 *                     time:
 *                       type: date
 *                       example: 2023-08-13T 16:34:12
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                          | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *                 data:
 *                   type: string
 *                   example: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 서버 오류입니다.
 *                 data:
 *                   type: string
 *                   example: null
 */
//식물 등록 정보 조회
router.get("/", async (req, res, next) => {
     try {
          // 사용자의 식물 정보 검색
          const plant = await DefaultData.find({
               email: res.locals.user.email,
          }).lean();

          // db에 데이터가 존재하지 않는 경우
          if (plant === null || plant === undefined) {
               const err = new Error("해당 유저의 기기를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 식물정보 전송
          res.json({ err: null, data: plant });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /check-plant/realtime:
 *   get:
 *     summary: 실시간 식물 정보 조회
 *     tags: [Plant]
 *     responses:
 *       200:
 *         description: 실시간 식물 정보 가져오기 성공
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
 *                     plantName:
 *                       type: string
 *                       example: 방울토마토
 *                     temperature:
 *                       type: number
 *                       example: 23
 *                     humidity:
 *                       type: number
 *                       example: 56
 *                     soilMoisture:
 *                       type: number
 *                       example: 67
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                          | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 기기로부터 데이터를 가져오는데 실패하였습니다.
 *                 data:
 *                   type: string
 *                   example: null
 */
// 실시간 식물 정보 조회(유저가 가지고 있는 모든 식물 정보를 실시간으로 가져와야 함)
router.get("/realtime", async (req, res, next) => {
     const realTimeTopic = "dt/farm/house/realtime";

     let isSubscribe = true; // user가 데이터 요청했는지 check하는 변수

     // 타임아웃을 설정.
     const timeout = setTimeout(() => {
          const error = new Error("기기로부터 데이터 가져오는 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
          error.statusCode = 408;
          next(error);

          // 일회용 event listener를 삭제
          client.removeListener("message", mqttEventListener);
     }, 5000);

     // event listener를 설정
     const mqttEventListener = async (topic, message) => {
          const data = JSON.parse(message.toString());
          const { deviceId, temperature, humidity, soilMoisture } = data;
          const userEmail = await DefaultData.findOne({ deviceId }).lean();

          if (topic === realTimeTopic && isSubscribe && userEmail) {
               try {
                    // 필요한 데이터가 있는지 확인
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
                         const err = new Error("기기로부터 데이터 가져오기를 실패하였습니다");
                         err.statusCode = 500;
                         return next(err);
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
                         return next(err);
                    }

                    // device에서 보낸 데이터가 요청을 보낸 유저와 일치하는 경우에만 데이터 보냄
                    if (res.locals.user.email === userEmail.email) {
                         // 데이터 전송
                         res.json({
                              error: null,
                              data: {
                                   // 소수점 2자리까지
                                   deviceName: userEmail.deviceName,
                                   temperature: temperature.toFixed(2),
                                   humidity: humidity.toFixed(2),
                                   soilMoisture: soilMoisture.toFixed(2),
                              },
                         });
                    }
               } catch (err) {
                    console.error(err);
                    const error = new Error("기기로부터 데이터 가져오기를 실패하였습니다");
                    error.statusCode = 500;
                    next(error);
               } finally {
                    isSubscribe = false;
                    clearTimeout(timeout);
                    client.removeListener("message", mqttEventListener);
               }
          } else {
               isSubscribe = false;
               clearTimeout(timeout);
               client.removeListener("message", mqttEventListener);
               const error = new Error("등록되지 않은 기기입니다.");
               error.statusCode = 400;
               return next(error);
          }
     };
     client.on("message", mqttEventListener);
});

module.exports = router;
