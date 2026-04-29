import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import {
  analyzeCvText,
  createPersonalizedRecommendation,
  extractTextFromUpload,
  getDashboardSnapshot,
  getQuizQuestions,
  getRoleProfiles,
  scoreQuiz
} from './services/analysis.js';
import {
  closeDatabase,
  getLatestActivity,
  initDatabase,
  isDatabaseEnabled,
  saveCvAnalysis,
  saveLead,
  saveQuizResult
} from './repositories/store.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

function getCorsOrigin() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';

  if (raw.trim() === '*') {
    return '*';
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(cors({ origin: getCorsOrigin() }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'skillmap-api',
    stack: 'express',
    database: isDatabaseEnabled() ? 'postgresql' : 'memory'
  });
});

app.get('/api/roles', (_request, response) => {
  response.json({ roles: getRoleProfiles() });
});

app.post('/api/cv/upload', upload.single('cv'), async (request, response, next) => {
  try {
    const domain = request.body.domain || request.query.domain || 'technology';
    const targetRole = request.body.targetRole || request.query.targetRole || 'fullstack-web-developer';
    const fileName = request.file?.originalname || 'cv.txt';
    const extractedText = extractTextFromUpload(request.file, request.body);
    const analysis = analyzeCvText(extractedText, { domain, targetRole });

    await saveCvAnalysis({
      fileName,
      fileSize: request.file?.size || 0,
      analysis
    });

    response.status(201).json({
      fileName,
      fileSize: request.file?.size || 0,
      ...analysis
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/quiz/questions', (request, response) => {
  const domain = request.query.domain || 'technology';
  const targetRole = request.query.targetRole || 'fullstack-web-developer';

  response.json({
    questions: getQuizQuestions(domain, targetRole)
  });
});

app.post('/api/quiz/submit', async (request, response, next) => {
  try {
    const payload = request.body || {};
    const result = scoreQuiz(payload.answers, {
      domain: payload.domain || request.query.domain || 'technology',
      targetRole: payload.targetRole || request.query.targetRole || 'fullstack-web-developer'
    });

    await saveQuizResult({ score: result.score, result });
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/recommendations', (request, response) => {
  const recommendation = createPersonalizedRecommendation(request.body || {});
  response.status(201).json(recommendation);
});

app.get('/api/dashboard/overview', async (_request, response, next) => {
  try {
    const snapshot = getDashboardSnapshot();
    const activity = await getLatestActivity();
    response.json({ ...snapshot, activity });
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard/:userId', async (request, response, next) => {
  try {
    const snapshot = getDashboardSnapshot();
    const activity = await getLatestActivity();
    response.json({
      ...snapshot,
      user: {
        ...snapshot.user,
        id: request.params.userId
      },
      activity
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/leads', async (request, response, next) => {
  try {
    const email = String(request.body?.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      response.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    const lead = await saveLead({
      email,
      targetRole: request.body?.targetRole
    });

    response.status(201).json({
      message: 'Journey request received.',
      lead
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/project/requirements', (_request, response) => {
  response.json({
    project: 'SkillMap - Navigator Pembelajaran Keterampilan yang Dipersonalisasi',
    mvpFeatures: [
      'CV upload and NLP-style skill extraction',
      'Adaptive readiness quiz',
      'Skill gap mapping against target role',
      'Personalized learning path recommendation',
      'Result dashboard with persisted activity'
    ],
    technicalCoverage: {
      frontend: ['React', 'Vite', 'Axios networking calls', 'responsive mockup and layout'],
      backend: ['Express REST API', 'RESTful URL convention', 'PostgreSQL persistence with memory fallback'],
      aiMl: ['TensorFlow-ready model service contract', 'skill extraction and recommendation contract'],
      dataScience: ['dataset/EDA/dashboard integration contract', 'business-question driven insights']
    }
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

let server;

async function start() {
  await initDatabase();
  server = app.listen(port, () => {
    console.log(`SkillMap Express API listening on port ${port}`);
  });
}

process.on('SIGINT', async () => {
  await closeDatabase();
  server?.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  server?.close(() => process.exit(0));
});

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { app };
