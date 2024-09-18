const router = require("express").Router();
const mongoose = require("mongoose");
const { DefaultData, GraphData, User } = require("../data");

/**
 * @swagger
 * tags:
 *   name: Device
 *   description: 기기 정보 API
 * /device:
 *   get:
 *     summary: 등록된 기기 정보 조회
 *     tags: [Device]
 *     responses:
 *       200:
 *         description: 기기 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: null
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example : ["기기1", "기기2", "기기3"]
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/componets/schemas/failRes"
 *             example:
 *               err: 탈퇴한 회원입니다.
 *               data: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/componets/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                  | 유효하지 않거나 손상된 토큰입니다.
 *               data: null
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schema/failRes"
 *             example:
 *               err: 접근 권한이 없습니다.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schema/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
//등록된 기기 정보 조회
router.get("/", async (req, res, next) => {
     try {
          // 미들웨어를 통해 decode된 토큰에서 email로 db에서 해당 유저 찾음
          const user = await User.findOne({ email: res.locals.user.email }).lean();
          const registration = await DefaultData.find({ email: res.locals.user.email }).lean();

          // 탈퇴한 회원인 경우
          if (user.isUser === false) {
               const err = new Error("탈퇴한 회원입니다.");
               err.statusCode = 400;
               return next(err);
          }
          const deviceName = registration.map((item) => item.deviceName);

          res.status(200).json({ err: null, data: deviceName });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /device/{deivceName}:
 *   get:
 *     summary: 기기 세부 정보 조회 API
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 세부 정보가 필요한 기기명
 *     responses:
 *       200:
 *         description: 기기 세부 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/data"
 *             example:
 *               deviceName: 기기1
 *               plantName: 방울토마토
 *               minTemperature: 10
 *               maxTemperature: 25
 *               minHumidity: 10
 *               maxHumidity: 25
 *               minSoilMoisture: 10
 *               maxSoilMoisture: 25
 *
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 될 수 없습니다.
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 *
 */
//기기 세부 정보 조회
router.get("/:deviceName", async (req, res, next) => {
     try {
          const { deviceName } = req.params;

          // params로 받은 기기명이 문자열이 아니거나 빈 값인 경우
          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          const foundDevice = await DefaultData.findOne({ deviceName }).lean();
          // params로 받은 기기가 db에 존재하지 않는 경우
          if (foundDevice === null || foundDevice === undefined) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          res.status(200).json({
               err: null,
               data: {
                    deviceName,
                    plantName: foundDevice.plantName,
                    minTemperature: foundDevice.minTemperature,
                    maxTemperature: foundDevice.maxTemperature,
                    minHumidity: foundDevice.minHumidity,
                    maxHumidity: foundDevice.maxHumidity,
                    minSoilMoisture: foundDevice.minSoilMoisture,
                    maxSoilMoisture: foundDevice.maxSoilMoisture,
               },
          });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /data/{deviceName}:
 *   delete:
 *     summary: 기기 삭제 API
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: deviceName
 *         schema:
 *           type: string
 *         required: true
 *         description: 삭제하려는 기기명
 *     responses:
 *       204:
 *         description: 기기 삭제 성공
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 기기명은 문자열이며 빈 값이 될 수 없습니다.
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
 *               err: 해당 유저를 찾을 수 없습니다.
 *               data: null
 *       500:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schmas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
// 기기 삭제
router.delete("/:deviceName", async (req, res, next) => {
     // Client 인스턴스 생성
     const session = await mongoose.startSession();
     // 트랜잭션 시작
     session.startTransaction();
     try {
          const { deviceName } = req.params;
          const email = res.locals.user.email;
          const foundDevice = await DefaultData.findOne({ email, deviceName }).lean();

          if (foundDevice === null || foundDevice === undefined) {
               const err = new Error("해당 기기를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          if (typeof deviceName !== "string" || deviceName.trim() === "") {
               const err = new Error("기기명은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 초기 데이터 및 그래프 데이터 삭제

          await DefaultData.deleteMany({ email, deviceName }).session(session);
          await GraphData.deleteMany({ email, deviceName }).session(session);

          await session.commitTransaction();
          res.status(204).json();
     } catch (e) {
          // 트랜잭션 종료
          await session.abortTransaction();
          next(e);
     } finally {
          // 세션 종료
          session.endSession();
     }
});

module.exports = router;
