const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

module.exports = { generateToken, generateInvitationToken: generateToken };
