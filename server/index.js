require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const requireAuth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const paymentRoutes = require('./routes/payments');
const { syncExpiredStatuses } = require('./utils/statusSync');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/members', requireAuth, memberRoutes);
app.use('/api/payments', requireAuth, paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

async function start() {
  try {
    await connectDB();
    await syncExpiredStatuses();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    const statusSyncTimer = setInterval(() => {
      syncExpiredStatuses().catch((err) => {
        console.error('Scheduled status sync failed:', err.message);
      });
    }, 15 * 60 * 1000);
    statusSyncTimer.unref();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
