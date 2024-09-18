const { Schema } = require("mongoose");

const userSchema = new Schema(
     {
          email: {
               type: String,
               required: true,
          },
          name: {
               type: String,
               required: true,
          },
          password: {
               type: String,
               required: true,
          },
          phoneNumber: {
               type: String,
               required: true,
          },
          // 회원 탈퇴 여부 판단하는 필드
          isUser: {
               type: Boolean,
               required: true,
               default: true,
          },
     },
     {
          versionKey: false, // __v 필드 숨김
     }
);

module.exports = userSchema;
