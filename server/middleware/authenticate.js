const { User } = require('../models/user');

const authenticate = async (req, res, next) => {
  const token = req.header('access_token');

  try {
    const user = await User.findByToken('access', token);
    if (!user) {
      return res.status(401).send({ error: 'Invalid access token' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: e.message });
  }
};

module.exports = { authenticate };
