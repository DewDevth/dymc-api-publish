

const express = require("express");
const router = express.Router();
const approveController = require("../../controllers/approve/approveController");
// const formTodoController = require("../../controllers/forms/FormTodoController");

router.get("/approve-list", approveController.getFormNotApprove);
router.post("/form-content-view", approveController.GetFormByProtId);
router.post("/update-recover", approveController.UpdateRecoverByProtId);
router.post("/update-request-approval", approveController.UpdateRequestApprovalByProtId);
router.post("/update-approval", approveController.UpdateApproveByProtId);

router.post("/create-new-revision", approveController.CreateNewRevision)
router.post("/protByIso", approveController.getProtByISO);

router.post("/get-iso", approveController.getIsoMaster);













module.exports = router;
