const passwordService = require('../services/passwordService');

/**
 * Change password
 * Delegates to authController.changePassword for consistency
 */
const changePassword = async (req, res) => {
  // Import authController untuk reuse logic
  const authController = require('./authController');
  return authController.changePassword(req, res);
};

module.exports = {
  changePassword,
};
