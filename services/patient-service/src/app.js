const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const patientRoutes = require('./routes/patientRoutes');
const authRoutes = require('./routes/authRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'patient-service', status: 'ok' });
});

// Routes
app.use('/api/patients/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patients/medical-records', medicalRecordRoutes);
app.use('/api/patients/prescriptions', prescriptionRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
