const router = require("express").Router();
const myPageRouter = require("./myPageRouter");
const dataRouter = require("./dataRouter");
const authRouter = require("./authRouter");
const accountRouter = require("./accountRouter");
const checkPlantRouter = require("./checkPlant");
const controlRouter = require("./controlRouter");
const deviceRouter = require("./deviceRouter");

const { isAuthenticatedMiddleware } = require("../middlewares");

router.use("/user", isAuthenticatedMiddleware, myPageRouter);
router.use("/data", isAuthenticatedMiddleware, dataRouter);
router.use("/authentication", authRouter);
router.use("/", accountRouter);
router.use("/check-plant", isAuthenticatedMiddleware, checkPlantRouter);
router.use("/control", isAuthenticatedMiddleware, controlRouter);
router.use("/device", isAuthenticatedMiddleware, deviceRouter);

module.exports = router;
