const dns = require('dns');
const originalLookup = dns.lookup.bind(dns);
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  dns.resolve4(hostname, (err, addresses) => {
    if (err) return originalLookup(hostname, options, callback);
    callback(null, addresses[0], 4);
  });
};

require('./services/admin-service/node_modules/dotenv').config({ path: './services/admin-service/.env' });
const mongoose = require('./services/admin-service/node_modules/mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.connection.db.collection('admins').updateOne(
    { email: 'admin@healthcare.com' },
    { $set: { permissions: ['manageAdmins','verifyDoctors','manageDoctors','managePatients','viewAnalytics','viewAuditLogs','manageAppointments','sendNotifications','viewDashboard'] } }
  );
  console.log('Updated:', result.modifiedCount);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
