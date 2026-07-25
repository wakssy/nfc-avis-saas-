const crypto = require('crypto');

function generateInvitationToken() {
  return crypto.randomBytes(32).toString('base64url');
}

module.exports = { generateInvitationToken };
