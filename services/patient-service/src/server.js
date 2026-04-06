const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Patient Service running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start Patient Service:', err);
  process.exit(1);
});
