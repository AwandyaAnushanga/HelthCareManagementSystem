const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startEventConsumer } = require('./events/consumer');

const PORT = process.env.PORT || 3005;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  await startEventConsumer();

  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start Notification Service:', err);
  process.exit(1);
});
