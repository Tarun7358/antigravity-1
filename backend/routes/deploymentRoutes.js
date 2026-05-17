const express = require('express');
const router = express.Router();
const { spawn, execSync } = require('child_process');
const prisma = require('../config/prisma');

// In-memory store for active deployment processes (for log streaming)
const activeDeployments = new Map();

// GET /api/deployments/:workspaceId - fetch deployment history from PostgreSQL
router.get('/:workspaceId', async (req, res) => {
  try {
    const deployments = await prisma.deploymentLog.findMany({
      where: { workspaceId: req.params.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ deployments });
  } catch (err) {
    console.error('Failed to fetch deployments:', err);
    // Graceful fallback while DB connects
    res.json({ deployments: [] });
  }
});

// POST /api/deployments/:workspaceId/deploy - trigger a Docker build deployment
router.post('/:workspaceId/deploy', async (req, res) => {
  const { workspaceId } = req.params;
  const { service = 'workspace-app', env = 'staging', image = 'node:18-bullseye-slim' } = req.body;

  const deploymentId = `dep-${Date.now()}`;

  // Persist the deployment record to PostgreSQL
  let dbRecord = null;
  try {
    dbRecord = await prisma.deploymentLog.create({
      data: {
        id: deploymentId,
        service,
        env,
        status: 'building',
        commit: `manual trigger`,
        workspaceId,
      },
    });
  } catch (err) {
    console.error('Could not persist deployment to DB (continuing anyway):', err.message);
  }

  res.json({
    message: 'Deployment started',
    deployment: dbRecord || {
      id: deploymentId,
      service,
      env,
      status: 'building',
      workspaceId,
    },
  });

  // Run the Docker pull + run in the background to simulate a live deployment
  const volName = `antigravity-deploy-${workspaceId.slice(0, 8)}`;
  try {
    execSync(`docker volume create ${volName}`, { stdio: 'ignore' });
  } catch { /* already exists */ }

  const proc = spawn('docker', [
    'run', '--rm',
    '--name', `ag-deploy-${deploymentId}`,
    '-v', `${volName}:/app`,
    '-w', '/app',
    '--memory', '512m',
    '--cpus', '0.5',
    image,
    'bash', '-c',
    `echo "🚀 Starting deployment: ${service} → ${env}..." && \
     echo "📦 Installing dependencies..." && \
     sleep 1 && \
     echo "✔ Dependencies installed" && \
     echo "🔨 Building application..." && \
     sleep 1 && \
     echo "✔ Build complete" && \
     echo "🌐 Deploying to ${env}..." && \
     sleep 1 && \
     echo "✅ Deployment successful! Service: ${service} | Env: ${env}"`,
  ]);

  activeDeployments.set(deploymentId, { proc, logs: [] });

  proc.stdout.on('data', (data) => {
    const entry = activeDeployments.get(deploymentId);
    if (entry) entry.logs.push({ type: 'stdout', text: data.toString() });
  });

  proc.stderr.on('data', (data) => {
    const entry = activeDeployments.get(deploymentId);
    if (entry) entry.logs.push({ type: 'stderr', text: data.toString() });
  });

  proc.on('close', async (code) => {
    const finalStatus = code === 0 ? 'active' : 'failed';
    if (dbRecord) {
      try {
        await prisma.deploymentLog.update({
          where: { id: deploymentId },
          data: { status: finalStatus },
        });
      } catch { /* DB might not be up */ }
    }
    activeDeployments.delete(deploymentId);
  });
});

// GET /api/deployments/:workspaceId/logs/:deploymentId — SSE stream for live build logs
router.get('/:workspaceId/logs/:deploymentId', (req, res) => {
  const { deploymentId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const entry = activeDeployments.get(deploymentId);
  if (!entry) {
    res.write(`data: ${JSON.stringify({ type: 'info', text: 'Deployment already completed or not found.' })}\n\n`);
    res.end();
    return;
  }

  // Send buffered logs so far
  entry.logs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Hook into future log events
  const { proc } = entry;
  const onStdout = (data) => res.write(`data: ${JSON.stringify({ type: 'stdout', text: data.toString() })}\n\n`);
  const onStderr = (data) => res.write(`data: ${JSON.stringify({ type: 'stderr', text: data.toString() })}\n\n`);
  const onClose = (code) => {
    res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
    res.end();
  };

  proc.stdout.on('data', onStdout);
  proc.stderr.on('data', onStderr);
  proc.on('close', onClose);

  req.on('close', () => {
    proc.stdout.off('data', onStdout);
    proc.stderr.off('data', onStderr);
    proc.off('close', onClose);
  });
});

module.exports = router;
