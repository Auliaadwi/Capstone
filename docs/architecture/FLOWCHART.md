# Alur Aplikasi SkillMap

Dokumen ini menjelaskan alur aplikasi SkillMap berdasarkan implementasi frontend React, Flask API, service analisis, repository penyimpanan, data dashboard, dan rencana proyek capstone CC26-PSU401.

## Alur Utama Pengguna

```mermaid
flowchart TD
  A([Mulai]) --> B[Buka aplikasi web SkillMap]
  B --> C[Frontend siap menerima CV]

  C --> E[Upload CV PDF]
  E --> E0{Semua biodata terisi?}
  E0 -->|Tidak| H[Isi profil singkat tambahan]
  E0 -->|Ya| I1[POST /api/cvs]

  H --> I
  I{CV PDF dan ringkasan lengkap?} -->|Tidak| H
  I -->|Ya| I1[POST /api/cvs]

  I1 --> J[API validasi format PDF]
  J --> J1[Ekstrak PDF menjadi teks]
  J1 --> J2[Tampilkan teks PDF yang dibaca AI]
  J2 --> K[Kirim teks CV ke AI Railway]
  K --> L[AI Railway mengembalikan recommended career dan score]
  L --> M[Normalisasi response untuk frontend]
  M --> N[Simpan analisis CV]
  N --> P[Tampilkan skill terdeteksi dan gap prioritas]

  P --> P1[Tampilkan rekomendasi pekerjaan berdasarkan persentase kecocokan]
  P1 --> Q[POST /api/career-fit-quizzes]
  Q --> Q1[Mini quiz kecenderungan karier]
  Q1 --> U[POST /api/recommendations]
  U --> V[POST /api/career-results]
  V --> W[Gabungkan hasil CV, job match, dan jawaban mini quiz]

  W --> X[Dashboard menampilkan role final, kekuatan, gap, sinyal industri, dan roadmap]
  X --> Y{Simpan perjalanan belajar?}

  Y -->|Ya| Z[Masukkan email]
  Z --> AA[POST /api/leads]
  AA --> AB{Email valid?}
  AB -->|Ya| AC[Simpan lead]
  AB -->|Tidak| AD[Tampilkan pesan error]

  Y -->|Tidak| AE([Selesai])
  AC --> AE
  AD --> X
```

## Alur Backend dan Data

```mermaid
flowchart LR
  U[Pengguna] --> UI[React UI]
  UI --> APIClient[Axios API client]

  APIClient --> CV[POST /api/cvs]
  APIClient --> Questions[GET /api/quiz-questions]
  APIClient --> CareerFit[POST /api/career-fit-quizzes]
  APIClient --> Quiz[POST /api/career-results]
  APIClient --> Rec[POST /api/recommendations]
  APIClient --> Dash[GET /api/dashboard-snapshots/overview]
  APIClient --> Leads[POST /api/leads]

  subgraph FlaskAPI[Flask REST API]
    CV
    Questions
    CareerFit
    Quiz
    Rec
    Dash
    Leads
  end

  subgraph Analysis[Service Analysis]
    Extract[extractTextFromUpload]
    Analyze[analyzeCvText]
    RoleProfile[role profiles]
    Taxonomy[skill taxonomy]
    QuizBank[quiz bank]
    Score[scoreQuiz]
    Recommend[createPersonalizedRecommendation]
    CareerFitBuilder[generateCareerFitQuiz]
  end

  CV --> Extract --> Analyze
  Analyze --> Taxonomy
  Analyze --> RoleProfile
  Analyze --> SaveCV[saveCvAnalysis]

  Questions --> QuizBank
  Questions --> RoleProfile

  CareerFit --> CareerFitBuilder
  Quiz --> Score
  Score --> SaveQuiz[saveQuizResult]

  Rec --> Recommend
  Recommend --> RoleProfile

  Dash --> Activity[getLatestActivity]

  Leads --> ValidateEmail{Email valid?}
  ValidateEmail -->|Ya| SaveLead[saveLead]
  ValidateEmail -->|Tidak| Error400[400 Bad Request]

  subgraph Storage[Penyimpanan]
    DB[(PostgreSQL)]
    Memory[(In-memory fallback)]
  end

  SaveCV --> StoreChoice{DATABASE_URL tersedia?}
  SaveQuiz --> StoreChoice
  SaveLead --> StoreChoice
  Activity --> StoreChoice

  StoreChoice -->|Ya| DB
  StoreChoice -->|Tidak| Memory

  DB --> Tables[users, cvs, skills, user_skills, learning_paths, quiz_attempts, leads]
  Memory --> MemoryData[cvAnalyses, quizAttempts, leads]
```

## Ringkasan Input, Proses, Output

| Tahap | Input | Proses | Output |
|-------|-------|--------|--------|
| Load awal | Halaman web dibuka | Siapkan state aplikasi dan sesi auth jika tersedia | Aplikasi siap menerima CV |
| Profil singkat | Posisi yang dituju, skill/pengalaman tambahan, profil singkat | Validasi semua field wajib sebelum lanjut | Konteks pelengkap CV |
| Analisis CV | File CV PDF, ringkasan profil, biodata, domain, target role | Validasi input, ekstraksi teks PDF, deteksi skill, mapping ke required skills | Teks PDF yang dibaca AI, extracted skills, skill gap, readiness score, job match percentage |
| Mini quiz | Pilihan pengguna dari beberapa opsi role | Validasi kecenderungan karier dari job match | Role yang paling kuat dari CV dan minat pengguna |
| Rekomendasi | Skill hasil CV, job match, jawaban mini quiz | Gabungkan sinyal CV dan quiz untuk rekomendasi akhir | Readiness score final, skill gap, roadmap belajar, career/course recommendation |
| Dashboard | Hasil analisis, hasil quiz, rekomendasi akhir | Render insight personal | Role final, kekuatan, gap, roadmap |
| Lead capture | Email dan target role | Validasi email lalu simpan | Lead tersimpan atau pesan error |

## Referensi Implementasi

| Komponen | Lokasi |
|----------|--------|
| Frontend | `apps/web/src/App.jsx` |
| API client | `apps/web/src/api.js` |
| Flask API | `../BE-Capstone/src/app.py` |
| Logic analisis | `../BE-Capstone/src/services/analysis.py` |
| Repository penyimpanan | `../BE-Capstone/src/repositories/store.py` |
| Skema database | `../BE-Capstone/database/schema.sql` |
