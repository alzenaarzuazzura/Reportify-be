/**
 * Validator untuk query parameters
 */

class Validator {
  /**
   * Validate dan sanitize query parameters
   * @param {Object} query - Express req.query
   * @param {Object} allowedFields - Allowed fields untuk filter dan sort
   * @returns {Object} Validated query parameters
   */
  static validateQueryParams(query, allowedFields = {}) {
    const {
      search,
      order,  // field name (was sortBy)
      sort,   // asc/desc (was order)
      page,
      limit,
      ...filters
    } = query;

    // Validate order (field name)
    const validatedOrder = allowedFields.sortFields?.includes(order)
      ? order
      : undefined;

    // Validate sort (direction)
    const validatedSort = ['asc', 'desc'].includes(sort?.toLowerCase())
      ? sort.toLowerCase()
      : 'asc';

    // Validate page and limit
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Validate filters - hanya ambil field yang diizinkan
    const validatedFilters = {};
    if (allowedFields.filterFields) {
      Object.keys(filters).forEach(key => {
        if (allowedFields.filterFields.includes(key)) {
          validatedFilters[key] = filters[key];
        }
      });
    }

    return {
      search: search?.trim(),
      order: validatedOrder,      // field name
      sort: validatedSort,         // asc/desc
      page: validatedPage,
      limit: validatedLimit,
      filters: validatedFilters
    };
  }

  /**
   * Validate date range
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {boolean} Is valid
   */
  static isValidDateRange(dateFrom, dateTo) {
    if (!dateFrom || !dateTo) return true;
    
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    
    return from <= to;
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }
}

module.exports = Validator;
