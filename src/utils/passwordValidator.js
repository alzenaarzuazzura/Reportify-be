/**
 * Password Validator Utility
 * Validates password strength with multiple criteria
 */

/**
 * Validate password strength
 * Requirements:
 * - Minimal 8 karakter
 * - Minimal 1 huruf besar (A-Z)
 * - Minimal 1 huruf kecil (a-z)
 * - Minimal 1 angka (0-9)
 * - Minimal 1 simbol (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * 
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar (A-Z)');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil (a-z)');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka (0-9)');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 simbol (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get password validation error message
 * @param {string[]} errors - Array of error messages
 * @returns {string} Formatted error message
 */
const getPasswordErrorMessage = (errors) => {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return 'Password tidak memenuhi kriteria:\n' + errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');
};

module.exports = {
  validatePasswordStrength,
  getPasswordErrorMessage
};
