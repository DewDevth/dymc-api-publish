

const express = require("express");
const router = express.Router();
const duplicateController = require("../../controllers/duplicate/duplicate");

// create-new-revision
router.post("/duplicate-prot", duplicateController.duplicateProt)















module.exports = router;
