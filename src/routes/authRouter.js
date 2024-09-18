const router = require("express").Router();
const { User, AuthenticationCode } = require("../data");
const nodemailer = require("nodemailer");
const { isTempAuthenticatedMiddleware } = require("../middlewares");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// 인증 번호 발송할 메일 계정 등록
const transporter = nodemailer.createTransport({
     service: "gmail",
     host: "smtp.gmail.com",
     port: 587,
     secure: false,
     auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
     },
});

// 랜덤 4자리 숫자
function randomNumber() {
     let num = "";
     for (let i = 0; i < 4; i++) {
          num += Math.floor(Math.random() * 10);
     }
     return num;
}

// 이메일 주소 조건
const emailCondition = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// 비밀번호 조건
const passwordCondition = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 인증 API
 * /authentication/email:
 *   post:
 *     summary: 이메일 인증
 *     tags: [Authentication]
 *     requestBody:
 *       description: 비밀번호 재설정을 위한 이메일
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: 이메일 인증 완료 -> 메일 전송
 *         headers:
 *           Set-Cookies:
 *             schema:
 *               type: string
 *               example: _tt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdEB0ZXN0LmNvbSJ9.8vXxCZjgkaYuDfZFMMOCDsim65_rX7Z-VfMsbntbv5w; Path:/; HttpOnly
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
 *                   example: null
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 이메일은 문자열이며 빈 값이 될 수 없습니다.
 *                          | 이메일 형식과 맞지 않습니다.
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
 *                   example: 존재하지 않는 이메일입니다.
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
 *                          | 메일 전송에 실패하였습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *
 */
// 이메일 인증
router.post("/email", async (req, res, next) => {
     try {
          const { email } = req.body;

          // 이메일이 문자열이 아니거나 빈 값인 경우
          if (typeof email !== "string" || email.trim() === "") {
               const err = new Error("이메일은 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 이메일이 조건에 안 맞는 경우
          if (emailCondition.test(email) === false) {
               const err = new Error("이메일 형식과 맞지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 이메일이 사용자 collection에 존재하지 않는 경우
          const foundEmail = await User.findOne({ email }).lean();
          if (foundEmail === null || foundEmail === undefined) {
               const err = new Error("존재하지 않는 이메일입니다.");
               err.statusCode = 404;
               return next(err);
          }

          // 탈퇴한 회원인 경우
          if (foundEmail.isUser === false) {
               const err = new Error("탈퇴한 회원입니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 사용자가 5분 이내에 이메일을 다시 전송했을 경우
          // 인증번호 전송하려는 이메일이 인증코드 collecion에 존재하는지 체크하고 있다면 삭제 시킴
          await AuthenticationCode.findOneAndDelete({ email }).lean();

          // 이메일로 인증 코드 전송
          let code = randomNumber();
          const mailOptions = {
               from: process.env.EMAIL_USER,
               to: email,
               subject: `[smartFarm]에서 보낸 인증번호입니다.`,
               text: `[smartFarm] 이메일 인증 번호는 [${code}]입니다.`,
          };

          transporter.sendMail(mailOptions, async (err, info) => {
               if (err) {
                    const err = new Error("메일 전송에 실패했습니다.");
                    err.statusCode = 500;
                    return next(err);
               }
               // 이메일 전송 성공 시
               // 임시 토큰 생성
               const jwtToken = jwt.sign(
                    {
                         email,
                    },
                    process.env.JWT_TEMP_SECRET_KEY,
                    { expiresIn: "5m" }
               );

               // 코드와 이메일을 db에 저장하는 코드 추가
               await AuthenticationCode.create({ email, code });

               // tempCookies 생성
               res.cookie("_tt", jwtToken, {
                    httpOnly: true,
               }).json();
          });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /authenticaion/code:
 *   post:
 *     summary: 인증코드 확인
 *     tags: [Authentication]
 *     requestBody:
 *       description: 메일로 받은 인증코드
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: number
 *     responses:
 *       200:
 *         description: 인증 완료
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: _tt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpc0NoZWNrIjp0cnVlfQ.JZPqb5TO5EuNVUiWPBx90QQ5L2S5jcVg9uBFUfVl0Rg; Path:/; HttpOnly
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
 *                   example: 인증되었습니다.
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 인증번호는 4자리 숫자입니다. 다시 입력해주세요.
 *                          | 잘못된 인증번호 입니다. 다시 입력해주세요.
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 토큰이 만료되었습니다. 다시 인증해주세요.
 *                         | 유효하지 않거나 손상된 토큰입니다. 다시 인증해주세요.
 *                         | 인증되지 않은 이메일입니다. 다시 인증해주세요.
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
// 인증코드 확인
router.post("/code", isTempAuthenticatedMiddleware, async (req, res, next) => {
     try {
          const { code } = req.body;
          // token에 들어있는 이메일로 인증코드를 보낸 데이터가 db에 존재하는지 않는 경우
          const foundData = await AuthenticationCode.findOne({ email: res.locals.temp.email }).lean();
          if (foundData === false || foundData === null) {
               const err = new Error("인증되지 않은 이메일입니다. 다시 인증해주세요.");
               err.statusCode = 401;
               return next(err);
          }

          // 입력받은 인증번호가 4자리 숫자가 아닌 경우
          if (Number.isInteger(code) === false || code.toString().length !== 4) {
               const err = new Error("인증번호는 4자리 숫자입니다. 다시 입력해주세요.");
               err.statusCode = 400;
               return next(err);
          }

          // db에 있는 인증번호와 일치하지 않는 경우
          if (foundData.code !== code) {
               const err = new Error("인증번호가 일치하지 않습니다. 다시 입력해주세요.");
               err.statusCode = 400;
               return next(err);
          }

          const jwtToken = jwt.sign({ email: foundData.email, isCheck: true }, process.env.JWT_TEMP_SECRET_KEY, {
               expiresIn: "5m",
          });

          // tempCookies 생성
          res.cookie("_tt", jwtToken, {
               httpOnly: true,
          }).json({ err: null, data: "인증되었습니다." });
     } catch (e) {
          next(e);
     }
});

/**
 * @swagger
 * /authentication/change-password:
 *   put:
 *     summary: 비밀번호 재설정
 *     tags: [Authentication]
 *     requestBody:
 *       description: 변경하려는 비밀번호, 재확인 비밀번호
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
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
 *                   example: null
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 비밀번호가 일치하지 않습니다.
 *                          | 변경하려는 비밀번호 양식이 맞지 않습니다.
 *                          | 변경하려는 비밀번호가 일치하지 않습니다.
 *                 data:
 *                   type: string
 *                   example: null
 *       401:
 *         description: UnAuthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *                   example: 인증되지 않았습니다. 다시 인증해주세요.
 *                          | 토큰이 만료되었습니다. 다시 인증해주세요.
 *                          | 유효하지 않거나 손상된 토큰입니다. 다시 인증해주세요.
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
 *                          | 업데이트하는 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
 *                 data:
 *                   type: string
 *                   example: null
 */
// 비밀번호 재설정
router.put("/change-password", isTempAuthenticatedMiddleware, async (req, res, next) => {
     try {
          const { password, confirmPassword } = req.body;
          // 인증코드 확인하지 않았을 경우
          if (res.locals.temp.isCheck === false) {
               const err = new Error("인증되지 않았습니다. 다시 인증해주세요");
               err.statusCode = 401;
               return next(err);
          }

          // 해당 이메일을 가진 회원 db 존재 여부 체크
          const foundUser = await User.findOne({ email: res.locals.temp.email }).lean();
          if (foundUser === undefined || foundUser === null) {
               const err = new Error("존재하지 않는 회원입니다.");
               err.statusCode = 404;
               return next(err);
          }

          // password가 문자열이 아니거나 빈 값인 경우
          if (typeof password !== "string" || password.trim() === "") {
               const err = new Error("비밀번호는 문자열이며 빈 값이 아니어야 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // password가 조건에 맞지 않는 경우
          if (passwordCondition.test(password) === false || password.length < 7) {
               const err = new Error("비밀번호는 대소문자와 특수문자를 모두 포함하여 7자리 이상이어 합니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 비밀번호가 일치하지 않는 경우
          if (password !== confirmPassword) {
               const err = new Error("비밀번호가 일치하지 않습니다.");
               err.statusCode = 400;
               return next(err);
          }

          // 비밀번호 해시화
          const hashPassword = await bcrypt.hash(password, 10);

          // 비밀번호 업데이트
          const updateData = await User.updateOne({ email: res.locals.temp.email }, { password: hashPassword });

          // 업데이트가 이루어지지 않았을 경우
          if (updateData.modifiedCount === 0) {
               const err = new Error("업데이트 하는 과정에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
               err.statusCode = 500;
               return next(err);
          }
          // 임시 쿠키 삭제
          res.clearCookie("_tt");
          res.status(200).json({ err: null, data: null });
     } catch (e) {
          next(e);
     }
});
module.exports = router;
