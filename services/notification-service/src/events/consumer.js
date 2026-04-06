const { getChannel, EXCHANGE } = require('../config/rabbitmq');
const Notification = require('../models/Notification');
const { sendEmail } = require('../config/mailer');

const QUEUE = 'notification.events.queue';

const handlers = {
  'appointment.booked': async (data) => {
    await Notification.create({
      userId: data.patientId,
      type: 'appointment_booked',
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${data.doctorName} on ${new Date(data.appointmentDate).toLocaleDateString()} at ${data.timeSlot} has been booked.`,
      data,
      channel: 'both',
    });

    await sendEmail(
      data.patientEmail,
      'Appointment Booked - Healthcare Platform',
      `<h2>Appointment Confirmed</h2>
       <p>Your appointment with <strong>Dr. ${data.doctorName}</strong> has been booked.</p>
       <p><strong>Date:</strong> ${new Date(data.appointmentDate).toLocaleDateString()}</p>
       <p><strong>Time:</strong> ${data.timeSlot}</p>
       <p><strong>Type:</strong> ${data.type}</p>`
    );
  },

  'appointment.confirmed': async (data) => {
    await Notification.create({
      userId: data.patientId,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Dr. ${data.doctorName} has confirmed your appointment.`,
      data,
      channel: 'both',
    });

    await sendEmail(
      data.patientEmail,
      'Appointment Confirmed - Healthcare Platform',
      `<h2>Appointment Confirmed</h2>
       <p>Dr. <strong>${data.doctorName}</strong> has confirmed your appointment.</p>`
    );
  },

  'appointment.cancelled': async (data) => {
    await Notification.create({
      userId: data.patientId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${data.doctorName} has been cancelled.`,
      data,
      channel: 'both',
    });

    await sendEmail(
      data.patientEmail,
      'Appointment Cancelled - Healthcare Platform',
      `<h2>Appointment Cancelled</h2>
       <p>Your appointment with Dr. <strong>${data.doctorName}</strong> has been cancelled.</p>`
    );
  },

  'video.link.added': async (data) => {
    await Notification.create({
      userId: data.patientId,
      type: 'video_link',
      title: 'Video Consultation Link Available',
      message: `Dr. ${data.doctorName} has uploaded a video consultation link for your appointment.`,
      data,
      channel: 'both',
    });

    await sendEmail(
      data.patientEmail,
      'Video Consultation Link - Healthcare Platform',
      `<h2>Video Consultation Available</h2>
       <p>Dr. <strong>${data.doctorName}</strong> has shared a video consultation link.</p>
       <p><a href="${data.videoLink}">Click here to view the consultation</a></p>`
    );
  },
};

const startEventConsumer = async () => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  // Bind to specific events
  const bindings = [
    'appointment.booked',
    'appointment.confirmed',
    'appointment.cancelled',
    'video.link.added',
  ];
  for (const key of bindings) {
    await channel.bindQueue(QUEUE, EXCHANGE, key);
  }

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      const handler = handlers[routingKey];
      if (handler) {
        await handler(data);
        console.log(`Notification processed: ${routingKey}`);
      } else {
        console.log(`No handler for event: ${routingKey}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('Error processing notification event:', err);
      channel.nack(msg, false, true);
    }
  });

  console.log('Notification consumer started');
};

module.exports = { startEventConsumer };
