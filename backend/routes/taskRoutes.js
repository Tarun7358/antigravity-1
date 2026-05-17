const express = require('express');
const { createTask, getTasks, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router({ mergeParams: true });

// Mounted at /api/workspaces/:workspaceId/tasks
router.route('/')
  .post(protect, createTask)
  .get(protect, getTasks);

router.route('/:taskId/status')
  .put(protect, updateTaskStatus);

module.exports = router;
