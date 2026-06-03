import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 90000
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
export const fetchProjectRequirements = () => api.get('/api/project-requirements');
export const fetchJobVacancies = (role, location = '', limit = 6) =>
  api.get(`/api/job-vacancies?role=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}&limit=${encodeURIComponent(limit)}`);
export const fetchQuizQuestions = (domain = 'technology', targetRole = 'fullstack-web-developer') =>
  api.get(`/api/quiz-questions?domain=${encodeURIComponent(domain)}&targetRole=${encodeURIComponent(targetRole)}`);
export const createCareerFitQuiz = (payload) => api.post('/api/career-fit-quizzes', payload);
export const createFinalCareerResult = (payload) => api.post('/api/career-results', payload);
export const submitQuiz = (payloadOrAnswers, domain = 'technology', targetRole = 'fullstack-web-developer') => {
  const payload = Array.isArray(payloadOrAnswers)
    ? { answers: payloadOrAnswers, domain, targetRole }
    : payloadOrAnswers;

  return api.post('/api/quiz-attempts', payload);
};
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
