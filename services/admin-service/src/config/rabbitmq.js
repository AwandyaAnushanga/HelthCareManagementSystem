const amqp = require('amqplib');

let channel = null;
const EXCHANGE = 'healthcare.events';

const connectRabbitMQ = async () => {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      console.log('Admin Service connected to RabbitMQ');
      return;
    } catch (err) {
      console.log(`RabbitMQ connection attempt ${i + 1}/${maxRetries} failed. Retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('Failed to connect to RabbitMQ');
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel, EXCHANGE };
