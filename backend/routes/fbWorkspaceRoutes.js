const express = require('express');
const { protectFirebase } = require('../middleware/firebaseAuthMiddleware');
const { createWorkspace, getMyWorkspaces, getPublicWorkspaces } = require('../controllers/fbWorkspaceController');

const router = express.Router();

// Public discovery (no auth)
router.get('/public', getPublicWorkspaces);

// Authenticated workspace actions
router.get('/', protectFirebase, getMyWorkspaces);
router.post('/', protectFirebase, createWorkspace);

module.exports = router;

