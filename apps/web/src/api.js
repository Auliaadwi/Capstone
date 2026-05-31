import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000
});

let authToken = '';

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  authToken = token || '';
};

export const fetchDashboard = () => api.get('/api/dashboard-snapshots/overview');
export const fetchProfile = () => api.get('/api/profile');
export const fetchCvHistory = () => api.get('/api/profile/cv-analyses');
export const fetchRoles = () => api.get('/api/roles');
export const fetchProjectRequirements = () => api.get('/api/project-requirements');
export const fetchQuizQuestions = (domain = 'technology', targetRole = 'fullstack-web-developer') =>
  api.get(`/api/quiz-questions?domain=${encodeURIComponent(domain)}&targetRole=${encodeURIComponent(targetRole)}`);
export const createCareerFitQuiz = (payload) => api.post('/api/career-fit-quizzes', payload);
export const createFinalCareerResult = (payload) => api.post('/api/career-results', payload);
export const submitQuiz = (answers, domain = 'technology', targetRole = 'fullstack-web-developer') =>
  api.post('/api/quiz-attempts', { answers, domain, targetRole });
export const createRecommendation = (payload) => api.post('/api/recommendations', payload);

export const uploadCv = async (file, domain = 'technology', targetRole = 'fullstack-web-developer', text = '', targetJob = '') => {
  const formData = new FormData();
  if (file) {
    formData.append('cv', file);
  }
  formData.append('domain', domain);
  formData.append('targetRole', targetRole);
  formData.append('targetJob', targetJob || '');
  if (text) {
    formData.append('text', text);
  }

  return api.post('/api/cvs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export { api };
