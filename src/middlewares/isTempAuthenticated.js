const jwt = require("jsonwebtoken");

// tempCookies 확인하는 미들웨어
const isTempAuthenticatedMiddleware = (req, res, next) => {
     const { _tt } = req.cookies;

     // tempCookies가 존재하지 않는 경우
     if (!_tt) {
          const err = new Error("접근 권한이 없습니다.");
          err.statusCode = 403;
          return next(err);
     }

     // 토큰 검증
     jwt.verify(_tt, process.env.JWT_TEMP_SECRET_KEY, (err, decoded) => {
          if (err) {
               res.clearCookie("_tt");
               if (err.name === "TokenExpiredError") {
                    const err = new Error("토큰이 만료되었습니다. 다시 인증해주세요.");
                    err.statusCode = 401;

                    return next(err);
               }

               if (err.name === "JsonWebTokenError") {
                    const err = new Error("유효하지 않거나 손상된 토큰입니다. 다시 인증해주세요.");
                    err.statusCode = 401;
                    return next(err);
               }
          }
          res.locals.temp = decoded;
          next();
     });
};

module.exports = isTempAuthenticatedMiddleware;
