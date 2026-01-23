const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'paint-secret';

module.exports = {
  // Use this to sign a token after they enter a valid Wall or Admin code
  signToken: function ({ _id, nickname, role, wallCode }) {
    const payload = { _id, nickname, role, wallCode };
    return jwt.sign({ data: payload }, secret, { expiresIn: '6h' });
  },

  authMiddleware: function (req, res, next) {
    let token = req.body.token || req.query.token || req.headers.authorization;
    if (req.headers.authorization) {
      token = token.split(' ').pop().trim();
    }

    if (!token) return res.status(401).json({ message: 'No session found' });

    try {
      const { data } = jwt.verify(token, secret);
      req.user = data; // Now req.user.role tells us if they are the Admin
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid session' });
    }
  }
};