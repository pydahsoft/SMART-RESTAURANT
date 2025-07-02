// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}/api${endpoint}`; 