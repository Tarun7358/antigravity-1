const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors = require('cors');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const fbWorkspaceRoutes = require('./routes/fbWorkspaceRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const prisma = require('./config/prisma');
const redis = require('./config/redis');
const { spawnContainer, isDockerAvailable } = require('./utils/dockerManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Configure Socket.IO Redis Adapter
const pubClient = redis;
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Connect to Prisma Database
prisma.$connect()
  .then(() => console.log('Successfully connected to PostgreSQL via Prisma'))
  .catch((err) => console.error('Failed to connect to Prisma DB:', err));

// Database selection (Legacy Fallback):
const mongoEnabled = process.env.DB_PROVIDER === 'mongo' || process.env.ENABLE_MONGO === 'true';
if (mongoEnabled) {
  connectDB({ required: true });
}

// Socket.IO — Isolated Docker Terminal & Real-time Features
io.on('connection', (socket) => {
  console.log('[Socket.IO] User connected:', socket.id);
  let ptyProcess = null;

  // Client sends workspace info to request a container
  socket.on('terminal-start', ({ workspaceId, runtime } = {}) => {
    const wsId = workspaceId || 'default';
    const rt = runtime || 'node';

    try {
      ptyProcess = spawnContainer(wsId, rt, 80, 24);

      // Emit Docker availability status to frontend
      socket.emit('terminal-ready', {
        dockerized: isDockerAvailable(),
        runtime: rt,
        workspaceId: wsId,
      });

      // Pipe PTY output to Socket
      ptyProcess.on('data', (data) => {
        socket.emit('terminal-data', data);
      });

      ptyProcess.on('exit', (code) => {
        socket.emit('terminal-exit', { code });
        ptyProcess = null;
      });
    } catch (err) {
      console.error('[Docker] Failed to spawn container:', err);
      socket.emit('terminal-error', { message: err.message });
    }
  });

  // Pipe Socket input to PTY
  socket.on('terminal-input', (data) => {
    if (ptyProcess) ptyProcess.write(data);
  });

  socket.on('terminal-resize', ({ cols, rows }) => {
    if (ptyProcess) ptyProcess.resize(cols, rows);
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] User disconnected:', socket.id);
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch (e) { /* already dead */ }
    }
  });
});

app.use('/api/ai', aiRoutes);
app.use('/api/deployments', deploymentRoutes);
if (mongoEnabled) {
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
} else {
  app.use('/api/auth', (req, res) => res.status(503).json({ message: 'Mongo DB disabled on backend. Use Firebase-based APIs under /api/fb/*.' }));
  app.use('/api/workspaces', (req, res) => res.status(503).json({ message: 'Mongo DB disabled on backend. Use Firebase-based APIs under /api/fb/*.' }));
}
app.use('/api/fb/workspaces', fbWorkspaceRoutes);
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
