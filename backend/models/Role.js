const mongoose = require('mongoose');

const roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#94a3b8', // Default slate-400
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          'ADMINISTRATOR',
          'MANAGE_WORKSPACE',
          'MANAGE_ROLES',
          'MANAGE_CHANNELS',
          'KICK_MEMBERS',
          'CREATE_INVITE',
          'SEND_MESSAGES',
          'MANAGE_MESSAGES',
        ],
      },
    ],
    position: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
