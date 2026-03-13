require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./db/connect');
const { seed } = require('./db/seed');
const { auth, requireManager } = require('./middleware/auth');
const { startCommunicationJobs } = require('./jobs/communicationJobs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running');
});

app.use('/auth', require('./routes/authRoutes'));
app.use('/staff', auth, require('./routes/staffRoutes'));
app.use('/api/employees', auth, require('./routes/employeeRoutes'));
app.use('/api/announcements', auth, require('./routes/announcementRoutes'));
app.use('/api/notifications', auth, require('./routes/notificationRoutes'));
app.use('/shifts', auth, require('./routes/shiftRoutes'));
const hoursRoutes = require('./routes/hoursRoutes');
app.use('/hours/me', auth, hoursRoutes.meRouter);
app.use('/hours', auth, hoursRoutes);

// AI routes (manager-only)
app.use('/api/ai', auth, requireManager, require('./routes/aiRoutes'));

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await seed();
    startCommunicationJobs();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} at http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
