const express = require('express');
const { createRole, getRoles, assignRole, removeRole } = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router({ mergeParams: true });

// Mounted at /api/workspaces/:workspaceId/roles
router.route('/')
  .post(protect, createRole)
  .get(protect, getRoles);

router.route('/members/:memberId/assign')
  .post(protect, assignRole);

router.route('/members/:memberId/remove/:roleId')
  .delete(protect, removeRole);

module.exports = router;
