const express = require('express');
const { createDocument, getDocuments, updateDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router({ mergeParams: true });

// Mounted at /api/workspaces/:workspaceId/documents
router.route('/')
  .post(protect, createDocument)
  .get(protect, getDocuments);

router.route('/:documentId')
  .put(protect, updateDocument);

module.exports = router;
