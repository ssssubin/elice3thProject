const { Schema } = require("mongoose");

const authenticationCodeSchema = new Schema(
     {
          email: {
               type: String,
               required: true,
          },
          code: {
               type: Number,
               required: true,
          },
          createdAt: {
               type: Date,
               default: Date.now,
          },
     },
     {
          versionKey: false, // __v 필드 숨김
     }
);

// TTL 인덱스 생성하여 5분 후에 데이터가 삭제되도록 설정
authenticationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = authenticationCodeSchema;
