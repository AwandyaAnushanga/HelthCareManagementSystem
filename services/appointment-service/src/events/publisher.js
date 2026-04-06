const { publishEvent } = require('../config/rabbitmq');

const publishAppointmentBooked = (appointment) => {
  publishEvent('appointment.booked', {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    patientEmail: appointment.patientEmail,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName,
    appointmentDate: appointment.appointmentDate,
    timeSlot: appointment.timeSlot,
    type: appointment.type,
    timestamp: new Date().toISOString(),
  });
};

const publishVideoLinkAdded = (appointment) => {
  publishEvent('video.link.added', {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    patientEmail: appointment.patientEmail,
    doctorName: appointment.doctorName,
    videoLink: appointment.videoConsultation.videoLink,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { publishAppointmentBooked, publishVideoLinkAdded };
