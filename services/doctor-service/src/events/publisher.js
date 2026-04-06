const { publishEvent } = require('../config/rabbitmq');

const publishDoctorRegistered = (doctor) => {
  publishEvent('doctor.registered', {
    doctorId: doctor._id,
    email: doctor.email,
    name: `${doctor.firstName} ${doctor.lastName}`,
    specialization: doctor.specialization,
    timestamp: new Date().toISOString(),
  });
};

const publishAvailabilityUpdated = (doctorId, dayOfWeek) => {
  publishEvent('availability.updated', {
    doctorId,
    dayOfWeek,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { publishDoctorRegistered, publishAvailabilityUpdated };
