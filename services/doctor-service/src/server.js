const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');

const PORT = process.env.PORT || 3002;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Doctor Service running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start Doctor Service:', err);
  process.exit(1);
});
