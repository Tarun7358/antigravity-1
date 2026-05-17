const Task = require('../models/Task');

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee } = req.body;
    const { workspaceId } = req.params;

    const task = await Task.create({
      title,
      description,
      status: status || 'To Do',
      priority,
      dueDate,
      assignee,
      workspace: workspaceId,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const tasks = await Task.find({ workspace: workspaceId }).populate('assignee', 'username avatar');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, updateTaskStatus };
