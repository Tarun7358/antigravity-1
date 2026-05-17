const pty = require('node-pty');
const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Map runtime names to Docker images
const RUNTIME_IMAGES = {
  node: 'node:18-bullseye-slim',
  python: 'python:3.11-slim',
  react: 'node:18-bullseye-slim',
  nextjs: 'node:18-bullseye-slim',
  default: 'node:18-bullseye-slim',
};

/**
 * Check if Docker daemon is accessible
 */
const isDockerAvailable = () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * Spawn a PTY session inside an ephemeral Docker container.
 * Falls back to a local shell if Docker is not available.
 *
 * @param {string} workspaceId - Unique workspace ID for volume namespacing
 * @param {string} runtime - Runtime key ('node', 'python', 'react', 'nextjs')
 * @param {number} cols - Terminal columns
 * @param {number} rows - Terminal rows
 * @returns {object} ptyProcess - A node-pty compatible process
 */
const spawnContainer = (workspaceId, runtime = 'default', cols = 80, rows = 24) => {
  const dockerAvailable = isDockerAvailable();

  if (!dockerAvailable) {
    console.warn('[Docker] Docker daemon not available. Falling back to local shell.');
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    return pty.spawn(shell, [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd: process.cwd(),
      env: process.env,
    });
  }

  const image = RUNTIME_IMAGES[runtime] || RUNTIME_IMAGES.default;

  // Create a named volume per workspace to persist files
  const volumeName = `antigravity-workspace-${workspaceId}`;
  try {
    execSync(`docker volume create ${volumeName}`, { stdio: 'ignore' });
  } catch (e) {
    // Volume might already exist, that's fine
  }

  console.log(`[Docker] Spawning container for workspace ${workspaceId} using image ${image}`);

  // Spawn docker run as a PTY process
  const dockerArgs = [
    'run', '--rm', '-it',
    '--name', `ag-terminal-${workspaceId.slice(0, 8)}-${Date.now()}`,
    '-v', `${volumeName}:/workspace`,
    '-w', '/workspace',
    '--memory', '512m',
    '--cpus', '0.5',
    '--network', 'bridge',
    image,
    'bash',
  ];

  return pty.spawn('docker', dockerArgs, {
    name: 'xterm-color',
    cols,
    rows,
    cwd: process.cwd(),
    env: process.env,
  });
};

module.exports = { spawnContainer, isDockerAvailable, RUNTIME_IMAGES };
