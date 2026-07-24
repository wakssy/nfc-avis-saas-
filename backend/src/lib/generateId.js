const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(6).toString('base64url');
}

module.exports = generateId;
