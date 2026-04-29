import { Router } from "express";
import multer from "multer";
import { saveCvAnalysis } from "../db.js";
import { analyzeCvText } from "../services/analysis.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const buildFallbackText = (file) => {
  const name = file?.originalname ?? "untitled-cv.pdf";
  return `${name} fullstack react node sql python ai`;
};

router.post('/upload', upload.single('cv'), async (req, res) => {
  const file = req.file;
  const domain = req.body?.domain || req.query?.domain || 'technology';
  const extractedText = req.body?.text || buildFallbackText(file);
  const analysis = analyzeCvText(extractedText, domain);

  // best-effort persist
  saveCvAnalysis({
    fileName: file?.originalname ?? 'cv.pdf',
    ...analysis
  }).catch(() => null);

  return res.json({
    fileName: file?.originalname ?? 'cv.pdf',
    fileSize: file?.size ?? 0,
    ...analysis
  });
});

export default router;
