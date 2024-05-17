const express = require("express");
const router = express.Router();
const ordersControllers = require("../../controllers/orders/AllOrders");

router.get("/orders", ordersControllers.getOrders);

module.exports = router;
