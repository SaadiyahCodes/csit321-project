// frontend/src/services/analyticsService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Analytics Service
 * Handles all API calls to the analytics endpoints
 */
export const analyticsService = {
  /**
   * Fetch analytics dashboard data
   * @param {number} restaurantId - Restaurant ID
   * @param {string} dateRange - '7days' or '30days'
   * @returns {Promise<Object>} Analytics data
   */
  async getDashboard(restaurantId, dateRange = '7days') {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/dashboard?restaurant_id=${restaurantId}&date_range=${dateRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch analytics`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Analytics API Error:', error);
      throw error;
    }
  }
};

export default analyticsService;