const express = require("express");
const router = express.Router();
const topicController = require("../../controllers/topics/getTopicController");
const topicTypeController = require("../../controllers/topics/TopicTypeController");

router.get("/topics/:id", topicController.getTopicsByFormId);

router.get("/topic-types", topicTypeController.getTopicsTypes);


module.exports = router;
