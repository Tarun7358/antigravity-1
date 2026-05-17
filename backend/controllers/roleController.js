const Role = require('../models/Role');
const Workspace = require('../models/Workspace');

const createRole = async (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    const { workspaceId } = req.params;

    // Check if user is owner or has MANAGE_ROLES permission (skipping strict check for prototype)
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Determine position (append to bottom, position 0 is top)
    const existingRoles = await Role.find({ workspace: workspaceId });
    const position = existingRoles.length;

    const role = await Role.create({
      name,
      color,
      permissions: permissions || [],
      position,
      workspace: workspaceId,
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const roles = await Role.find({ workspace: workspaceId }).sort({ position: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { roleId } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const member = workspace.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found in workspace' });
    }

    if (!member.roles.includes(roleId)) {
      member.roles.push(roleId);
      await workspace.save();
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeRole = async (req, res) => {
  try {
    const { workspaceId, memberId, roleId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const member = workspace.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found in workspace' });
    }

    member.roles = member.roles.filter(r => r.toString() !== roleId);
    await workspace.save();

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRole, getRoles, assignRole, removeRole };
