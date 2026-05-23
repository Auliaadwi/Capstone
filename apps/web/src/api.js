import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000
});

export const fetchDashboard = () => api.get('/api/dashboard/overview');
export const fetchRoles = () => api.get('/api/roles');
export const fetchProjectRequirements = () => api.get('/api/project/requirements');
export const fetchQuizQuestions = (domain = 'technology', targetRole = 'fullstack-web-developer') =>
  api.get(`/api/quiz/questions?domain=${encodeURIComponent(domain)}&targetRole=${encodeURIComponent(targetRole)}`);
export const submitQuiz = (answers, domain = 'technology', targetRole = 'fullstack-web-developer') =>
  api.post('/api/quiz/submit', { answers, domain, targetRole });
export const createRecommendation = (payload) => api.post('/api/recommendations', payload);

export const uploadCv = async (file, domain = 'technology', targetRole = 'fullstack-web-developer', text = '') => {
  const formData = new FormData();
  if (file) {
    formData.append('cv', file);
  }
  formData.append('domain', domain);
  formData.append('targetRole', targetRole);
  if (text) {
    formData.append('text', text);
  }

  return api.post('/api/cv/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export { api };
