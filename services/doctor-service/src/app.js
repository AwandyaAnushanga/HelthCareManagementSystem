const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const doctorRoutes = require('./routes/doctorRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'doctor-service', status: 'ok' });
});

app.use('/api/doctors/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);

app.use(errorHandler);

module.exports = app;
