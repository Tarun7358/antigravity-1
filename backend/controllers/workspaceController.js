const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const Role = require('../models/Role');

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, roles: [] }],
    });

    // Create default @everyone role
    const everyoneRole = await Role.create({
      name: '@everyone',
      color: '#94a3b8', // Default color
      workspace: workspace._id,
      position: 999, // Lowest priority
    });

    // Create Owner role
    const ownerRole = await Role.create({
      name: 'Owner',
      color: '#fbbf24', // Amber/Gold
      workspace: workspace._id,
      permissions: ['ADMINISTRATOR'],
      position: 0, // Highest priority
    });

    // Assign owner role to the creator
    workspace.members[0].roles.push(everyoneRole._id);
    workspace.members[0].roles.push(ownerRole._id);
    await workspace.save();

    // Create default channels
    await Channel.create([
      { name: 'general', type: 'text', workspace: workspace._id },
      { name: 'voice-lounge', type: 'voice', workspace: workspace._id },
    ]);

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('members.user', 'username email avatar');
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaceChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ workspace: req.params.workspaceId });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createChannel = async (req, res) => {
  try {
    const { name, type } = req.body;
    const { workspaceId } = req.params;

    const channel = await Channel.create({
      name,
      type,
      workspace: workspaceId,
    });

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWorkspace, getWorkspaces, getWorkspaceChannels, createChannel };
