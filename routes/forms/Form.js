

const express = require("express");
const router = express.Router();
const formController = require("../../controllers/forms/FormController");

router.post("/form", formController.CreateForm);
router.post("/get-forms", formController.getForms);
router.post("/get-formbyId", formController.GetFormById);
router.post("/update-title-form", formController.UpdateTitleFormById);
router.post("/create-updateform", formController.CreateAndUpdateProtTopic);

router.post("/update-cancelflag-form", formController.UpdateCancelFlagFormById);
router.post("/update-cancelflag-form-user", formController.UpdateCancelFlagFormUserById);




module.exports = router;
