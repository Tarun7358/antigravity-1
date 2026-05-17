const express = require('express');
const { createWorkspace, getWorkspaces, getWorkspaceChannels, createChannel } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');
const taskRoutes = require('./taskRoutes');
const documentRoutes = require('./documentRoutes');
const roleRoutes = require('./roleRoutes');
const router = express.Router();

router.route('/')
  .post(protect, createWorkspace)
  .get(protect, getWorkspaces);

router.route('/:workspaceId/channels')
  .get(protect, getWorkspaceChannels)
  .post(protect, createChannel);

// Mount nested routes
router.use('/:workspaceId/tasks', taskRoutes);
router.use('/:workspaceId/documents', documentRoutes);
router.use('/:workspaceId/roles', roleRoutes);

module.exports = router;
