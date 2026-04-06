const { publishEvent } = require('../config/rabbitmq');

const publishPatientRegistered = (patient) => {
  publishEvent('patient.registered', {
    patientId: patient._id,
    email: patient.email,
    name: `${patient.firstName} ${patient.lastName}`,
    timestamp: new Date().toISOString(),
  });
};

const publishPatientUpdated = (patientId) => {
  publishEvent('patient.updated', {
    patientId,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { publishPatientRegistered, publishPatientUpdated };
