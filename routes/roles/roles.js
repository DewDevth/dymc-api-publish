const express = require("express");
const router = express.Router();
const rolesController = require("../../controllers/roles/roles");


router.get("/roles", rolesController.getRoles);
router.post("/role-cancel", rolesController.updateCancelRoleById);
router.post("/role-create", rolesController.createRole);
router.post("/role-update", rolesController.updateRoleById);
router.post("/role-delete", rolesController.deleteRoleById);

router.post("/role-stmt", rolesController.getSqlStmtByRoleId);
router.post("/role-user-create", rolesController.createRoleUsers);

router.post("/role-user-delete", rolesController.deleteUserRoleById);

router.get("/positions", rolesController.getPositions);


module.exports = router;
