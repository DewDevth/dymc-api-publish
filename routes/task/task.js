const express = require("express");
const router = express.Router();
const taskController = require("../../controllers/task/taskController");

router.post("/tasks", taskController.getTasks);
router.post("/tasks-approval", taskController.getTasksApproval);




module.exports = router;
