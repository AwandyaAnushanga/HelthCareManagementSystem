const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };
