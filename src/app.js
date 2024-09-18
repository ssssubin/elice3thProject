const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./routes");
const cookieParser = require("cookie-parser");

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOptions = require("./swagger/config");

app.use(express.json());
app.use(cookieParser());

// setup에서 쓰일 옵션 생성(swagger 관련)
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CORS 설정
const corsOptions = {
     origin: "http://localhost:5173", // 요청 허용할 도메인
     credentials: true, // 쿠키 포함한 요청 허용
};

// 라우터 연결
app.use("/api", router);

// 에러 핸들러
app.use((err, req, res, next) => {
     // err.statusCode가 null 이거나 undefined일 때 500 반환
     // 아니면 err.statusCode 반환
     const statusCode = err.statusCode ?? 500;
     if (statusCode === 500) {
          console.error(err); // 에러용 로그
          res.status(500).json({
               err: "서버 내부에 에러가 발생하였습니다.",
               data: null,
          });
          return;
     }
     res.status(statusCode).json({ err: err.message, data: null });
});

module.exports = app;
