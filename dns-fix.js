const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  originalLookup.call(dns, hostname, options, (err, address, family) => {
    if (!err) return callback(null, address, family);
    dns.resolve4(hostname, (err2, addresses) => {
      if (err2) return callback(err);
      callback(null, addresses[0], 4);
    });
  });
};
