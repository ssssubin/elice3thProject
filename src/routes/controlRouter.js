const express = require("express");
const router = express.Router();
const client = require("../MQTT");
const { DefaultData } = require("../data");

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/dcpan/{deviceName}:
 *   post:
 *     summary: DC 팬 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/control"
 *           example:
 *             control: true
 *     responses:
 *       200:
 *         description: DC 팬 제어 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: string
 *                   example: dc pan을 켰습니다.
 *                          | dc pan을 껐습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
// dc pan
router.post("/dcpan/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const control = req.body.control;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          // device로 요청을 보내는 topic
          const reqTopic = "cmd/farm/house/dcpan/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 제어값이 boolean 값이 아닌 경우
          if (typeof control !== "boolean") {
               const err = new Error("제어 값은 boolean 타입이어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 디바이스에게 control값을 보냄
          const message = { deviceId: findData.deviceId, control };
          // qos를 1로 설정하여 보내, puback을 받을 수 있도록 함
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { control } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/heater/{deviceName}:
 *   post:
 *     summary: 히터 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/control"
 *           example:
 *             control: true
 *     responses:
 *       200:
 *         description: 히터 제어 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: string
 *                   example: 히터를 켰습니다.
 *                          | 히터를 껐습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
// 히터
router.post("/heater/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const control = req.body.control;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          const reqTopic = "cmd/farm/house/heater/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 제어값이 boolean 값이 아닌 경우
          if (typeof control !== "boolean") {
               const err = new Error("제어 값은 boolean 타입이어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statuscode = 404;
               return next(err);
          }

          // 디바이스에게 control값을 보냄
          const message = { deviceId: findData.deviceId, control };
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { control } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/humidifier/{deviceName}:
 *   post:
 *     summary: 가습기 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/control"
 *           example:
 *             control: true
 *     responses:
 *       200:
 *         description: 가습기 제어 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: string
 *                   example: 가습기를 켰습니다.
 *                          | 가습기를 껐습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                 | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
//가습기
router.post("/humidifier/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const control = req.body.control;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          const reqTopic = "cmd/farm/house/humidifier/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 제어값이 boolean 값이 아닌 경우
          if (typeof control !== "boolean") {
               const err = new Error("제어 값은 boolean 타입이어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statuscode = 404;
               return next(err);
          }

          // 디바이스에게 control값을 보냄
          const message = { deviceId: findData.deviceId, control };
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { control } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/nutrient/{deviceName}:
 *   post:
 *     summary: 영양분 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/control"
 *           example:
 *             control: true
 *     responses:
 *       200:
 *         description: 영양분 제어 성공
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
 *                     nutrient:
 *                       type: number
 *                       example: 500
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                 | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
// 영양분
router.post("/nutrient/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const { nutrient } = req.body;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          const reqTopic = "cmd/farm/house/fertilizer/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 영양분이 숫자가 아닌 경우
          if (typeof nutrient !== "number") {
               const err = new Error("영양분은 숫자여야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statuscode = 404;
               return next(err);
          }

          // 디바이스에게 영양분값을 보냄
          const message = { deviceId: findData.deviceId, nutrient };
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { nutrient } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/pump/{deviceName}:
 *   post:
 *     summary: 워터 펌프 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               control:
 *                 type: boolean
 *                 example: true
 *               water:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: 워터 펌프 제어 성공
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
 *                     water:
 *                       type: number
 *                       example: 500
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 물 양은 숫자이고 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                 | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
// 워터 펌프
router.post("/pump/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const { water } = req.body;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          const reqTopic = "cmd/farm/house/pump/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 물의 양이 숫자가 아니거나 빈값인 경우
          if (typeof water !== "number" || water.toString().trim() === "") {
               const err = new Error("물 양은 숫자이고 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statuscode = 404;
               return next(err);
          }

          // 디바이스에게 control값을 보냄
          const message = { deviceId: findData.deviceId, water };
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { water } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * tags:
 *   name: Control
 *   description: 제어 API
 * /control/lighting/{deviceName}:
 *   post:
 *     summary: 조명 제어
 *     tags: [Control]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 제어하고자 하는 기기명
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/control"
 *           example:
 *             control: true
 *     responses:
 *       200:
 *         description: 조명 제어 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: string
 *                   example: 조명을 켰습니다.
 *                          | 조명을 껐습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 제어 값은 boolean 타입이어야 합니다.
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 해당 기기를 찾을 수 없습니다.
 *               data: null
 *       408:
 *         description: Request Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기로 데이터를 보내는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                  | 기기로부터 응답을 받지 못하였습니다. 다시 시도해주세요.
 *               data: null
 */
// 조명
router.post("/lighting/:deviceName", async (req, res, next) => {
     try {
          const deviceName = req.params.deviceName;
          const email = res.locals.user.email;
          const control = req.body.control;
          const findData = await DefaultData.findOne({ email, deviceName }).lean();
          const reqTopic = "cmd/farm/house/lighting/control/req";

          // 기기명이 문자열이 아니거나 빈값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 아니어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 제어값이 boolean 값이 아닌 경우
          if (typeof control !== "boolean") {
               const err = new Error("제어 값은 boolean 타입이어야 합니다.");
               err.statuscode = 400;
               return next(err);
          }

          // 해당 기기를 찾을 수 없는 경우
          if (findData === undefined || findData === null) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statuscode = 404;
               return next(err);
          }

          // 디바이스에게 control값을 보냄
          const message = { deviceId: findData.deviceId, control };
          await client.publishAsync(reqTopic, JSON.stringify(message), { qos: 1 }).catch((e) => {
               console.error(e);
               const err = new Error("기기로 데이터를 보내는 과정에서 오류가 발생했습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               next(err);
          });

          // 디바이스로 데이터를 보낼 때 5초가 초과되면 err 보냄
          const timer = setTimeout(() => {
               const err = new Error("기기로 데이터를 보내는데 시간이 오래 걸려 중단하였습니다. 다시 시도해주세요.");
               err.statusCode = 408; // timeout
               next(err);
          }, 5000);

          res.status(200).json({ err: null, data: { control } });
          clearTimeout(timer);
     } catch (e) {
          next(e);
     }
});

module.exports = router;
