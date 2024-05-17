const express = require("express");
const router = express.Router();
const formTodoController = require("../../controllers/forms/FormTodoController");
const flowApprovalController = require("../../controllers/approve/flowApprovalController");

router.post("/get-criterias", formTodoController.getCriteriasByProtId);

router.post("/todo-form", formTodoController.createTodoForm);
router.post("/todo-forms-list", formTodoController.getListFormTodo);
router.post("/users-forms", formTodoController.getListUsersFormTodo);
router.post("/get-form-content", formTodoController.getFormContentsByUrl);

//update value form
router.post("/update-form-value", formTodoController.UpdateValueFormByUserId);

router.post("/createApproval", flowApprovalController.CreateApproval);
router.post(
  "/UpdateStatusFormUserNotApproval",
  flowApprovalController.UpdateStatusFormUserNotApproval
);

router.post(
  "/get-form-approval",
  formTodoController.getFormForApprovalContentsByUrl
);

router.post(
  "/update-checksheet-approval",
  flowApprovalController.UpdateCheckSheetApproval
);

module.exports = router;
