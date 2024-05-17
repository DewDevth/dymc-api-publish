const express = require("express");
const router = express.Router();
const jobOnWebController = require("../../controllers/jobonweb/jobonwebController");

router.post("/job-on-web/product", jobOnWebController.GetProductById);
router.post("/job-on-web/machines", jobOnWebController.GetMachines);
router.post("/job-on-web/pump-machines", jobOnWebController.GetPumpMachines);
router.post(
  "/job-on-web/oil-bathing-machines",
  jobOnWebController.GetOilBathingMachines
);
router.post("/job-on-web/checksheets", jobOnWebController.GetCheckSheetsById);
router.post("/job-on-web/machine-id", jobOnWebController.GetMachineById);
router.post(
  "/job-on-web/create-new-form",
  jobOnWebController.createNewFormByProt
);
router.post("/job-on-web/update-form", jobOnWebController.UpdateFormFlag);

module.exports = router;
