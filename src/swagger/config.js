const { schema } = require("../data/models/User");

const swaggerOptions = {
     definition: {
          openapi: "3.0.0",
          info: {
               title: "Smart Farm API 문서",
               version: "1.0.0",
          },
          servers: [
               {
                    url: "http://localhost:3000/api/",
               },
               {
                    url: "http://34.64.78.252:3000/api/",
               },
          ],
          securityDefinitions: {
               jwt: {
                    type: "apiKey",
                    name: "Authorization",
                    in: "header",
               },
          },
          security: [{ jwt: [] }],
     },
     // apis : 문서화하려는 대상 파일 지정, swagger.js로 끝나는 모든 파일들 & router 파일들 문서화
     apis: ["./src/swagger/*", "./src/routes/*.js"], // 절대 경로로 설정
};

module.exports = swaggerOptions;
