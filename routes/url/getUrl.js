const express = require("express");
const router = express.Router();
const getUrlControllers = require("../../controllers/url/GetUrl");
const getMenuUrlControllers = require("../../controllers/url/GetMenuUrl");

router.get("/url", getUrlControllers.getUrl);
router.get("/menu-url", getMenuUrlControllers.getMenuUrl);

module.exports = router;
