const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'admin-service', status: 'ok' });
});

app.use('/api/admin/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
