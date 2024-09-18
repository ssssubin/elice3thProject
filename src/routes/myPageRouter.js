const router = require("express").Router();
const { User, DefaultData } = require("../data");
const bcrypt = require("bcrypt");

// 비밀번호 조건
const passwordCondition = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

/**
 * @swagger
 * tags:
 *   name: MyPage
 *   description: 마이페이지 API
 * /user:
 *   get:
 *     summary: 회원 정보 가져오기
 *     tags: [MyPage]
 *     responses:
 *       200:
 *         description: 회원 정보 조회 결과
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                     err:
 *                       type: string
 *                       example: null
 *                     data:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: 김철수
 *                           description: 유저 이름
 *                         email:
 *                           type: string
 *                           example: test@test.com
 *                           description: 유저 이메일
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 이미 탈퇴한 회원입니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: Unauthorized
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
 *
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 접근 권한이 없습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 해당 유저를 찾을 수 없습니다.
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
// 사용자 정보 조회
router.get("/", async (req, res, next) => {
     try {
          // 미들웨어를 통해 decode된 토큰에서 email로 db에서 해당 유저 찾음
          const user = await User.findOne({ email: res.locals.user.email }).lean();

          // 유저가 존재하지 않는 경우
          if (user === null || user === undefined) {
               const err = new Error("해당 유저를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 유저가 존재한다면
          // 탈퇴한 유저라면
          if (user.isUser === false) {
               const err = new Error("이미 탈퇴한 회원입니다.");
               err.statusCode = 400;
               return next(err);
          }

          res.status(200).json({ err: null, data: { name: user.name, email: user.email } });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /user/modify-password:
 *   put:
 *     summary: 비밀번호 변경
 *     tags: [MyPage]
 *     requestBody:
 *       description: 변경하려는 비밀번호와 기존 비밀번호
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               password:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 조회 결과
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                     err:
 *                       type: string
 *                       example: null
 *                     data:
 *                       type: string
 *                       example: 비밀번호가 정상적으로 변경되었습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 이미 탈퇴한 회원입니다.
 *                          | 비밀번호가 일치하지 않습니다.
 *                          | 비밀번호는 문자열이며 빈 값이 아니어야 합니다.
 *                          | 비밀번호는 대소문자와 특수문자를 모두 포함하여 7자리 이상이어야 합니다.
 *                          | 변경하려는 비밀번호가 일치하지 않습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: Unauthorized
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 접근 권한이 없습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 해당 유저를 찾을 수 없습니다.
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
 *                          | 비밀번호를 변경하는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                 data:
 *                   type: string
 *                   example: null
 */
// 비밀번호 변경
router.put("/modify-password", async (req, res, next) => {
     try {
          const user = await User.findOne({ email: res.locals.user.email }).lean();
          const { password, newPassword, confirmNewPassword } = req.body;

          // 유저가 존재하지 않는 경우
          if (user === null || user === undefined) {
               const err = new Error("해당 유저를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 유저가 존재한다면
          // 탈퇴한 유저인 경우
          if (user.isUser === false) {
               const err = new Error("이미 탈퇴한 회원입니다.");
               err.statusCode = 400;
               return next(err);
          }
          // db에 저장된 비밀번호와 일치하지 않는 경우
          const isPassword = await bcrypt.compare(password, user.password);
          if (isPassword === false) {
               const err = new Error("비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 변경하려는 비밀번호가 문자열이 아니거나 빈 값일 경우
          if (typeof newPassword !== "string" || newPassword.trim() === "") {
               const err = new Error("비밀번호는 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 변경하려는 비밀번호 길이가 7글자 미만이거나 영문자 또는 숫자 또는 특수문자 포함 안 됐을 경우
          // 변경하려는 비밀번호기 조건에 맞지 않는 경우
          if (passwordCondition.test(newPassword) === false || newPassword.length < 7) {
               const err = new Error("비밀번호는 대소문자와 특수문자를 모두 포함하여 7자리 이상이어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 변경하려는 비밀번호가 일치하지 않는 경우
          if (newPassword !== confirmNewPassword) {
               const err = new Error("변경하려는 비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }
          const hashPassword = await bcrypt.hash(newPassword, 10);
          const updateData = await User.updateOne({ email: user.email }, { password: hashPassword });

          // DB에 업데이트가 제대로 이루어지지 않았을 경우
          if (updateData.modifiedCount === 0) {
               const err = new Error("비밀번호를 변경하는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               return next(err);
          }

          res.clearCookie("_uu");
          res.status(200).json({ err: null, data: "비밀번호가 정상적으로 변경되었습니다." });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /user/withdrawal:
 *   put:
 *     summary: 회원 탈퇴
 *     tags: [MyPage]
 *     requestBody:
 *       description: 탈퇴하고자 하는 회원
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 회원 탈퇴
 *         content:
 *           application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  err:
 *                    type: string
 *                    example: null
 *                  data:
 *                    type: string
 *                    example: 정상적으로 탈퇴되었습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 이미 탈퇴한 회원입니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: Unauthorized
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 접근 권한이 없습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 해당 유저를 찾을 수 없습니다.
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
 *                          | 탈퇴하는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.
 *                 data:
 *                   type: string
 *                   example: null
 */
// 회원 탈퇴
router.put("/withdrawal", async (req, res, next) => {
     try {
          const user = await User.findOne({ email: res.locals.user.email }).lean();
          const password = req.body;

          // 유저가 존재하지 않는 경우
          if (user === null || user === undefined) {
               const err = new Error("해당 유저를 찾을 수 없습니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 유저가 존재한다면
          // 이미 탈퇴된 회원이라면
          if (user.isUser === false) {
               const err = new Error("이미 탈퇴한 회원입니다.");
               err.statusCode = 400;
               return next(err);
          }

          const updateData = await User.updateOne({ email: user.email }, { isUser: false });
          // DB에 업데이트가 제대로 이루어지지 않았을 경우
          if (updateData.modifiedCount === 0) {
               const err = new Error("탈퇴하는 과정에서 오류가 발생하였습니다. 다시 시도해주세요.");
               err.statusCode = 500;
               return next(err);
          }
          res.clearCookie("_uu");
          res.status(200).json({ err: null, data: "정상적으로 탈퇴되었습니다." });
     } catch (e) {
          next(e);
     }
});

module.exports = router;
