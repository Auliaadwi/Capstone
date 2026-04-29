import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveQuizResult } from '../db.js';

const router = Router();

const scoreQuiz = (answers = []) => {
  const positiveSignals = answers.filter((a) => a !== null && a !== undefined).length;
  const score = Math.min(100, 40 + positiveSignals * 20);

  const roadmap = score >= 80
    ? ['Build a domain-specific project', 'Add polish and tests', 'Publish your work']
    : ['Review fundamentals', 'Complete guided exercises', 'Practice small projects'];

  return {
    score,
    track: score >= 80 ? 'job-ready' : 'foundation',
    roadmap
  };
};

const loadQuizBank = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const file = path.join(__dirname, '..', 'data', 'quizBank.json');
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
};

const bank = loadQuizBank();

router.get('/questions', (req, res) => {
  const domain = req.query?.domain || 'technology';
  const questions = bank[domain] || bank['technology'] || [];
  return res.json({ questions });
});

router.post('/submit', (req, res) => {
  const domain = req.body?.domain || req.query?.domain || 'technology';
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const result = scoreQuiz(answers);

  // persist with domain info when possible
  saveQuizResult({ score: result.score, result: { ...result, domain } }).catch(() => null);

  return res.json(result);
});

export default router;
