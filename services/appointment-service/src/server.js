const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Appointment Service running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start Appointment Service:', err);
  process.exit(1);
});
