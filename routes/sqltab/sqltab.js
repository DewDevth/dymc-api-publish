const express = require("express");
const router = express.Router();
const sqlTabController = require("../../controllers/sqltab/sqlTab");
const tabController = require("../../controllers/sqltab/tab");

router.post("/sql-tabs", sqlTabController.getSqlTabAll);
router.post("/sql-tab", sqlTabController.getDataBySqlTab);
router.post("/sql-tab-approval", sqlTabController.getDataBySqlTabApproval);
router.get("/list-role", sqlTabController.getRoleList);
router.post("/role-id", sqlTabController.getRolesByRoleId);


// new sql tab  แบบ ไม่ดึงข้อมูลที่เดียว 200,000
router.post("/data-by-sql-tab-filter", tabController.getDataUsingSqlTabNo);



module.exports = router;
