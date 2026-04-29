# Reserved For AI/ML And Data Science Integration

Folder ini disiapkan untuk tim AI/Data Science ketika model analisis CV dan rekomendasi SkillMap mulai diintegrasikan.

Untuk fase MVP, analisis deterministik berjalan di Express API `apps/api/src/services/analysis.js` agar demo full-stack tetap stabil. Tim AI dapat menggantinya dengan service Flask/FastAPI mandiri untuk inference model TensorFlow, lalu Express tetap menjadi API utama yang dipakai frontend.

Kontrak integrasi yang sudah tersedia:

- `POST /api/cv/upload` untuk skill extraction dari CV/profile
- `POST /api/quiz/submit` untuk sinyal kesiapan dari quiz
- `POST /api/recommendations` untuk learning path personal
- `GET /api/dashboard/overview` untuk insight dashboard
