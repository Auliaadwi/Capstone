import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000
});

export const fetchDashboard = () => api.get('/api/dashboard/overview');
export const fetchQuizQuestions = (domain = 'technology') => api.get(`/api/quiz/questions?domain=${encodeURIComponent(domain)}`);
export const submitQuiz = (answers, domain = 'technology') => api.post('/api/quiz/submit', { answers, domain });

export const uploadCv = async (file, domain = 'technology') => {
  const formData = new FormData();
  formData.append('cv', file);
  formData.append('domain', domain);

  return api.post('/api/cv/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export { api };
