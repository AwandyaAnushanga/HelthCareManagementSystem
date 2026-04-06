const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ service: 'appointment-service', status: 'ok' });
});

app.use('/api/appointments', appointmentRoutes);

app.use(errorHandler);

module.exports = app;
