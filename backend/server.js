const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { auth, requireManager } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running');
});

app.use('/auth', require('./routes/authRoutes'));
app.use('/staff', auth, require('./routes/staffRoutes'));
const hoursRoutes = require('./routes/hoursRoutes');
app.use('/hours/me', auth, hoursRoutes.meRouter);
app.use('/hours', auth, hoursRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} at http://localhost:${PORT}/`));
