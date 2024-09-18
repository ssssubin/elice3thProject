const express = require("express");
const router = express.Router();
const axios = require("axios");

const { User } = require("../data");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { isAuthenticatedMiddleware } = require("../middlewares");

// 전화번호 조건 : 010으로 시작하며 뒤에 7 or 8자리 숫자
const phoneNumberCondition = /^010\d{7,8}$/;
// 이메일 주소 조건
const emailCondition = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// 비밀번호 조건
const passwordCondition = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 회원가입/로그인 API
 * /sign-up:
 *   post:
 *     summary: 회원가입
 *     tags: [User]
 *     requestBody:
 *       description: 가입하려는 유저 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref : "#/components/schemas/user"
 *     responses:
 *       201:
 *         description: 유저 생성
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
 *                          name:
 *                            type: string
 *                            example: 김철수
 *                          email:
 *                            type: string
 *                            example: test@test.com
 *                          phoneNumber:
 *                            type: string
 *                            example: 01012341234
 *
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 이름은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 이메일은 문자열이며 빈 값이 아니어야 합니다.
 *                  | 이메일 형식과 맞지 않습니다.
 *                  | 이미 존재하는 email입니다.
 *                  | 비밀번호는 문자열이며 빈 값이 아니어야 합니다.
 *                  | 비밀번호 양식이 맞지 않습니다.
 *                  | 비밀번호가 일치하지 않습니다.
 *                  | 전화번호는 문자열이며 빈 값이 아니어야 합니다.
 *               data: null
 *       500:
 *         description : Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: "서버 오류입니다."
 *               data: null
 */
// 회원가입 api
router.post("/sign-up", async (req, res, next) => {
     try {
          const { name, email, password, phoneNumber, confirmPassword } = req.body;

          // name이 string type이 아니거나 빈 값일 경우 에러 핸들러로 에러 넘김
          if (typeof name !== "string" || name.trim() === "") {
               const err = new Error("이름은 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // email이 string type이 아니거나 빈 값일 경우
          if (typeof email !== "string" || email.trim() === "") {
               const err = new Error("이메일은 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // email이 이메일 조건과 부합하지 않는 경우
          if (emailCondition.test(email) === false) {
               const err = new Error("이메일 형식과 맞지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 이메일 중복 체크
          const foundEmail = await User.findOne({
               email,
          }).lean();

          // 중복되는 이메일이 존재하는 경우
          if (foundEmail !== null && foundEmail !== undefined) {
               // 탈퇴한 회원이 다시 가입하려고 하는 경우
               if (foundEmail.isUser === false) {
                    const err = new Error("탈퇴한 회원입니다.");
                    err.statusCode = 400;
                    return next(err);
               }
               // 사용자가 회원가입여부를 까먹고 다시 가입하려고 하는 경우
               const err = new Error("이미 존재하는 이메일입니다.");
               err.statusCode = 400;
               return next(err);
          }

          // password가 string type이 아니거나 빈 값일 경우
          if (typeof password !== "string" || password.trim() === "") {
               const err = new Error("비밀번호는 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 비밀번호 길이가 7글자 미만이거나 영문자 또는 숫자 또는 특수문자 포함 안 됐을 경우
          // password가 조건에 맞지 않는 경우
          if (passwordCondition.test(password) === false || password.length < 7) {
               const err = new Error("비밀번호는 대소문자와 특수문자를 모두 포함하여 7자리 이상이어 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // password와 confirmPassword 불일치 할 경우
          if (password !== confirmPassword) {
               const err = new Error("비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // phoneNumber가 string type이 아니거나 빈 값일 경우
          if (typeof phoneNumber !== "string" || phoneNumber.trim() === "") {
               const err = new Error("전화번호는 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // phoneNumber 조건에 맞지 않을 경우
          if (phoneNumberCondition.test(phoneNumber) === false) {
               const err = new Error("올바른 전화번호가 아닙니다.");
               err.statusCode = 400;
               return next(err);
          }

          const hashPassword = await bcrypt.hash(password, 10); // 전달 받은 비밀번호 해시화

          // 유저 데이터 db에 저장하기
          const data = await User.create({
               name,
               email,
               password: hashPassword,
               phoneNumber,
          });

          res.status(201).json({
               err: null,
               data: {
                    name: data.name,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
               },
          });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /log-in:
 *   post:
 *     summary: 로그인
 *     tags: [User]
 *     requestBody:
 *       description: 로그인 시도하는 유저
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 완료
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: _uu=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20ifQ.X6AJFbd0lGwhnIwX_nBanhobijUYi0m_gdGlzW7KN5k; Path=/; HttpOnly
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
 *                       example: 로그인에 성공하셨습니다. 환영합니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 이메일은 문자열이며 빈 값이 될 수 없습니다.
 *                  | 이메일 형식과 맞지 않습니다.
 *                  | 비밀번호는 문자열이며 빈 값이 될 수 없습니다.
 *                  | 이메일이나 비밀번호가 일치하지 않습니다.
 *                  | 탈퇴한 사용자입니다.
 *               data: null
 *       500:
 *         description : Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 서버 오류입니다.
 *               data: null
 */
// 로그인 api
router.post("/log-in", async (req, res, next) => {
     try {
          const { email, password } = req.body;

          // 이메일이 string 값이 아니거나 빈 값일 때
          if (typeof email !== "string" || email.trim() === "") {
               const err = new Error("이메일은 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // email이 이메일 조건과 부합하지 않는 경우
          if (emailCondition.test(email) === false) {
               const err = new Error("이메일 형식과 맞지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 비밀번호가 string 값이 아니거나 빈 값일 때
          if (typeof password !== "string" || password.trim() === "") {
               const err = new Error("비밀번호는 문자열이며 빈 값이 될 수 없습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // req.body로 받은 email이 DB에 저장된 email과 일치하는 데이터 하나만 찾음
          const foundData = await User.findOne({
               email,
          }).lean();
          if (foundData === null || foundData === undefined) {
               const err = new Error("이메일이나 비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // req.body로 받은 password와 DB에 저장된 password와 일치하면 true, 불일치하면 false 반환
          const isPassword = await bcrypt.compare(password, foundData.password);
          if (!isPassword) {
               const err = new Error("이메일이나 비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 탈퇴한 사용자인 경우
          if (foundData.isUser === false) {
               const err = new Error("탈퇴한 사용자입니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 토큰 생성(이메일, 전화번호만 담김)
          const jwtToken = jwt.sign(
               {
                    _id: foundData._id,
                    email: foundData.email,
                    phoneNumber: foundData.phoneNumber,
               },
               process.env.JWT_USER_SECRET_KEY,
               { expiresIn: "1h" }
          );

          return res
               .cookie("_uu", jwtToken, {
                    httpOnly: true,
               })
               .json({
                    err: null,
                    data: {
                         message: "로그인에 성공하셨습니다. 환영합니다.",
                    },
               });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /log-out:
 *   post:
 *     summary: 로그아웃
 *     tags: [User]
 *     responses:
 *       200:
 *         description: 로그아웃 완료
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
 *                   example: 로그아웃 되었습니다.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: 토큰이 만료되었습니다. 다시 로그인해주세요.
 *                 | 유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.
 *               data: null
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/failRes"
 *             example:
 *               err: "서버 오류입니다."
 *               data: null
 *
 */
// 로그아웃 api
router.post("/log-out", isAuthenticatedMiddleware, async (req, res, next) => {
     try {
          // 로그아웃 시 로그인이 된 상태인지 확인 => 미들웨어로
          // 로그아웃 처리 로직
          res.clearCookie("_uu");
          res.json({
               err: null,
               data: "성공적으로 로그아웃 되었습니다.",
          });
          return;
     } catch (e) {
          next(e);
     }
});

// 카카오 회원가입 api
router.get("/social/sign-in", async (req, res, next) => {
     try {
          const { name, email, phoneNumber } = req.body;

          // name이 string type이 아니거나 빈 값일 경우 에러 핸들러로 에러 넘김
          if (typeof name !== "string" || name.trim() === "") {
               const err = new Error("이름은 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 이메일 중복 체크
          const foundEmail = await User.findOne({
               email,
          }).lean();

          // 중복되는 이메일이 존재하는 경우
          if (foundEmail !== null && foundEmail !== undefined) {
               // 탈퇴한 회원이 다시 가입하려고 하는 경우
               if (foundEmail.isUser === false) {
                    const err = new Error("존재하지 않는 회원입니다.");
                    err.statusCode = 400;
                    return next(err);
               }
               // 사용자가 회원가입여부를 까먹고 다시 가입하려고 하는 경우
               const err = new Error("이미 존재하는 이메일입니다.");
               err.statusCode = 400;
               return next(err);
          }
          // phoneNumber가 string type이 아니거나 빈 값일 경우
          if (typeof phoneNumber !== "string" || phoneNumber.trim() === "") {
               const err = new Error("전화번호는 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // phoneNumber 조건에 맞지 않을 경우
          if (phoneNumberCondition.test(phoneNumber) === false) {
               const err = new Error("올바른 전화번호가 아닙니다.");
               err.statusCode = 400;
               return next(err);
          }

          const hashPassword = await bcrypt.hash(email, 10); // 전달 받은 비밀번호 해시화

          // 유저 데이터 db에 저장하기
          const data = await User.create({
               name,
               email,
               password: hashPassword,
               phoneNumber,
          });

          res.status(201).json({
               err: null,
               data: {
                    name: data.name,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
               },
          });
     } catch (e) {
          next(e);
     }
});

// 카카오 로그인 api
router.get("/social/log-in", async (req, res, next) => {
     try {
          const { email } = req.body;

          // req.body로 받은 email이 DB에 저장된 email과 일치하는 데이터 하나만 찾음
          const foundData = await User.findOne({
               email,
          }).lean();
          if (foundData === null || foundData === undefined) {
               const err = new Error("이메일이 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }
          // 탈퇴한 사용자인 경우
          if (foundData.isUser === false) {
               const err = new Error("탈퇴한 사용자입니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 토큰 생성(이메일, 전화번호만 담김)
          const jwtToken = jwt.sign(
               {
                    _id: foundData._id,
                    email: foundData.email,
                    phoneNumber: foundData.phoneNumber,
               },
               process.env.JWT_USER_SECRET_KEY,
               { expiresIn: "1h" }
          );

          return res
               .cookie("_uu", jwtToken, {
                    httpOnly: true,
               })
               .json({
                    err: null,
                    data: {
                         message: "로그인에 성공하셨습니다. 환영합니다.",
                    },
               });
     } catch (e) {
          next(e);
     }
});

module.exports = router;
