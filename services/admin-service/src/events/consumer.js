const { getChannel, EXCHANGE } = require('../config/rabbitmq');
const AuditLog = require('../models/AuditLog');

const QUEUE = 'admin.audit.queue';

const startEventConsumer = async () => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  // Listen to ALL events for audit logging
  await channel.bindQueue(QUEUE, EXCHANGE, '#');

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      await AuditLog.create({
        eventType: routingKey,
        source: routingKey.split('.')[0] + '-service',
        data,
      });

      console.log(`Audit logged: ${routingKey}`);
      channel.ack(msg);
    } catch (err) {
      console.error('Error processing audit event:', err);
      channel.nack(msg, false, true);
    }
  });

  console.log('Admin audit consumer started');
};

module.exports = { startEventConsumer };
