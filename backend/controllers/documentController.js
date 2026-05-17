const Document = require('../models/Document');

const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { workspaceId } = req.params;

    const document = await Document.create({
      title: title || 'Untitled Document',
      content: content || '',
      workspace: workspaceId,
      author: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const documents = await Document.find({ workspace: workspaceId }).populate('author', 'username avatar');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const document = await Document.findById(req.params.documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDocument, getDocuments, updateDocument };
