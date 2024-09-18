module.exports = {
     env: {
          // 브라우저의 document와 같은 객체 사용 여부
          browser: true,
          es2021: true,
          // node.js에서 console과 같은 전역변수 사용 여부
          node: true,
     },
     extends: ["eslint:recommended", "plugin:prettier/recommended"],
     parserOptions: {
          ecmaVersion: 12,
          sourceType: "module",
          // back-end이기 때문에 jsx false로 설정
          ecmaFeatures: {
               jsx: false,
          },
     },
     plugins: ["prettier"],
     rules: {
          "prettier/prettier": "error",
          "linebreak-style": ["off", "unix"], // "off"와 "unix"를 함께 사용하여 모든 줄 바꿈 스타일 무시
     },
     ignorePatterns: ["node_modules/", ".env"],
};
