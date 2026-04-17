// Preload script: fixes DNS resolution for MongoDB Atlas on Windows
// The OS DNS resolver (dns.lookup) fails, but dns.resolve4 with Google DNS works.
// This overrides dns.lookup to use dns.resolve4 as a fallback.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  // Try original lookup first, fallback to resolve4 on failure
  originalLookup.call(dns, hostname, options, (err, address, family) => {
    if (!err) return callback(null, address, family);
    // Fallback to dns.resolve4
    dns.resolve4(hostname, (err2, addresses) => {
      if (err2) return callback(err); // return original error
      callback(null, addresses[0], 4);
    });
  });
};
