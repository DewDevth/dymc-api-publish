const express = require("express");
const router = express.Router();
const getTokenControllers = require("../controllers/Token");
const getmodeNameControllers = require("../controllers/modeNameController");


router.post("/token", getTokenControllers.getToken);
router.get("/mode", getmodeNameControllers.getTitleMode);

module.exports = router;
