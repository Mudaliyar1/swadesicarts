const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const parseMediaQuery = (req, res, next) => {
  req.mediaFilters = {
    view: req.query.view === 'table' ? 'table' : 'grid',
    type: req.query.type || 'all',
    usage: req.query.usage || 'all',
    search: (req.query.search || '').trim(),
    section: (req.query.section || '').trim(),
    dateFrom: req.query.dateFrom || '',
    dateTo: req.query.dateTo || '',
    owner: req.query.owner || 'all',
    page: Math.max(1, toNumber(req.query.page, 1)),
    limit: Math.min(100, Math.max(12, toNumber(req.query.limit, 24)))
  };

  next();
};

const normalizeBulkDeleteBody = (req, res, next) => {
  let publicIds = req.body.publicIds;

  if (typeof publicIds === 'string') {
    try {
      const parsed = JSON.parse(publicIds);
      publicIds = parsed;
    } catch (error) {
      publicIds = [publicIds];
    }
  }

  if (!Array.isArray(publicIds)) {
    return res.status(400).json({ success: false, message: 'publicIds must be an array' });
  }

  req.body.publicIds = publicIds
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter(Boolean);

  next();
};

module.exports = {
  parseMediaQuery,
  normalizeBulkDeleteBody
};
