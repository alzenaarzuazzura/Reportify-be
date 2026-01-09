/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} status - Status keberhasilan request
 * @property {string} message - Pesan response
 * @property {T | null} data - Data response
 */

/**
 * Helper function untuk membuat success response
 * @template T
 * @param {string} message - Pesan sukses
 * @param {T} data - Data yang akan dikirim
 * @returns {ApiResponse<T>}
 */
const successResponse = (message, data) => {
  return {
    status: true,
    message,
    data
  };
};

/**
 * Helper function untuk membuat error response
 * @param {string} message - Pesan error
 * @returns {ApiResponse<null>}
 */
const errorResponse = (message) => {
  return {
    status: false,
    message,
    data: null
  };
};

module.exports = {
  successResponse,
  errorResponse
};
