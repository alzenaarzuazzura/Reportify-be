/**
 * Query Builder Utility untuk Search, Filter, Sort, dan Pagination
 * Aman dari SQL Injection karena menggunakan Prisma
 */

class QueryBuilder {
  /**
   * Build where clause untuk search
   * @param {string} search - Search term
   * @param {Array<string>} searchFields - Fields yang akan di-search
   * @returns {Object} Prisma where clause
   */
  static buildSearchQuery(search, searchFields = []) {
    if (!search || searchFields.length === 0) return {};

    return {
      OR: searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive'
        }
      }))
    };
  }

  /**
   * Build where clause untuk filter
   * @param {Object} filters - Filter object
   * @returns {Object} Prisma where clause
   */
  static buildFilterQuery(filters = {}) {
    const where = {};

    Object.keys(filters).forEach(key => {
      const value = filters[key];
      
      if (value === undefined || value === null || value === '') return;

      // Handle date range
      if (key.endsWith('_from')) {
        const fieldName = key.replace('_from', '');
        where[fieldName] = { ...where[fieldName], gte: new Date(value) };
      } else if (key.endsWith('_to')) {
        const fieldName = key.replace('_to', '');
        where[fieldName] = { ...where[fieldName], lte: new Date(value) };
      } 
      // Handle array (in operator)
      else if (Array.isArray(value)) {
        where[key] = { in: value };
      }
      // Handle exact match
      else {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Build orderBy clause untuk sorting
   * @param {string} sortBy - Field to sort by
   * @param {string} order - Sort order (asc | desc)
   * @param {string} defaultSort - Default sort field
   * @returns {Object} Prisma orderBy clause
   */
  static buildSortQuery(sortBy, order = 'asc', defaultSort = 'id') {
    const validOrders = ['asc', 'desc'];
    const sortOrder = validOrders.includes(order?.toLowerCase()) 
      ? order.toLowerCase() 
      : 'asc';

    return {
      [sortBy || defaultSort]: sortOrder
    };
  }

  /**
   * Build pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @param {number} maxLimit - Maximum items per page
   * @returns {Object} { skip, take }
   */
  static buildPagination(page = 1, limit = 10, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(
      maxLimit,
      Math.max(1, parseInt(limit) || 10)
    );

    return {
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit
    };
  }

  /**
   * Build complete query dengan search, filter, sort, dan pagination
   * @param {Object} params - Query parameters
   * @returns {Object} Complete Prisma query object
   */
  static buildQuery(params = {}) {
    const {
      search,
      searchFields = [],
      filters = {},
      sortBy,
      order,
      defaultSort,
      page,
      limit,
      maxLimit
    } = params;

    const searchQuery = this.buildSearchQuery(search, searchFields);
    const filterQuery = this.buildFilterQuery(filters);
    const sortQuery = this.buildSortQuery(sortBy, order, defaultSort);
    const pagination = this.buildPagination(page, limit, maxLimit);

    // Combine search and filter
    const where = Object.keys(searchQuery).length > 0
      ? { AND: [searchQuery, filterQuery] }
      : filterQuery;

    return {
      where,
      orderBy: sortQuery,
      ...pagination
    };
  }

  /**
   * Format response dengan pagination metadata
   * @param {Array} data - Data array
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Formatted response
   */
  static formatResponse(data, total, page, limit) {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / parsedLimit);

    return {
      success: true,
      data,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      }
    };
  }
}

module.exports = QueryBuilder;
