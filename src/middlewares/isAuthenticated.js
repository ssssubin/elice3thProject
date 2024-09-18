const jwt = require("jsonwebtoken");

// 쿠키 확인하는 미들웨어
const isAuthenticatedMiddleware = (req, res, next) => {
     const { _uu } = req.cookies;

     // userCookies가 존재하지 않는 경우(= 로그인되지 않았을 때)
     if (!_uu) {
          const err = new Error("접근 권한이 없습니다.");
          err.statusCode = 403;
          return next(err);
     }

     // 토큰 검증
     jwt.verify(_uu, process.env.JWT_USER_SECRET_KEY, (err, decoded) => {
          if (err) {
               res.clearCookie("_uu");
               if (err.name === "TokenExpiredError") {
                    const err = new Error("토큰이 만료되었습니다. 다시 로그인해주세요.");
                    err.statusCode = 401;
                    return next(err);
               }

               if (err.name === "JsonWebTokenError") {
                    const err = new Error("유효하지 않거나 손상된 토큰입니다. 다시 로그인해주세요.");
                    err.statusCode = 401;
                    return next(err);
               }
          }
          res.locals.user = decoded;
          next();
     });
};

module.exports = isAuthenticatedMiddleware;
