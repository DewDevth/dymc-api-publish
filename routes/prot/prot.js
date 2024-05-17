const express = require("express");
const router = express.Router();
const protController = require("../../controllers/forms/ProtController");


router.post("/delete-prot-by-id", protController.DeleteProtById);
router.get("/get-extras", protController.getExtraType);



module.exports = router;
