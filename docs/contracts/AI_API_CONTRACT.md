# Kontrak API SkillMap — Web ↔ AI

Dokumen ini adalah standar komunikasi antara sistem Web (Full-Stack) dan sistem AI. Karena tim AI men-deploy model sebagai API terpisah (Flask/FastAPI), format data JSON yang dikirim dan diterima wajib mengikuti struktur berikut agar frontend dan backend dapat memproses hasilnya tanpa error.

---

## 1. Endpoint: Ekstraksi dan Analisis CV

Menerima teks CV, mendeteksi skill yang dimiliki, dan memetakan tingkat kecocokan (Readiness Score) terhadap daftar role yang tersedia.

- **URL:** `POST /api/ai/analyze-cv`
- **Content-Type:** `application/json`

> **Catatan implementasi web:** Upload CV dari frontend harus berupa PDF melalui `POST /api/cvs` dengan `multipart/form-data`. Backend menolak file non-PDF, mengekstrak isinya menjadi teks, lalu teks itulah yang dikirim ke AI. Endpoint lama `POST /api/cv/upload` masih tersedia sebagai alias.

### Request Body (Web → AI)

Web mengirimkan teks CV mentah (hasil parse PDF di backend) ke AI:

```json
{
  "text": "Saya adalah lulusan Teknik Informatika dengan pengalaman menggunakan React, Node.js, dan Python. Pernah membuat project API menggunakan Express.",
  "domain": "technology"
}
```

### Response Body (AI → Web)

AI mengembalikan daftar skill yang terdeteksi beserta rekomendasi role terbaik:

```json
{
  "status": "success",
  "data": {
    "extractedSkills": ["React", "Node.js", "Python", "Express"],
    "jobMatches": [
      {
        "id": "project-manager-digital",
        "name": "Junior Project Manager Digital",
        "matchScore": 80,
        "matchedSkills": ["Time Management", "Communication", "Problem Solving"]
      }
    ],
    "suggestedRoleId": "fullstack-web-developer",
    "targetRole": "Junior Full-Stack Web Developer",
    "readinessScore": 75,
    "readinessLabel": "nearly ready",
    "skillGap": ["PostgreSQL", "Deployment", "Testing"],
    "roadmap": [
      {
        "id": "step-1",
        "title": "Close PostgreSQL gap",
        "focus": "PostgreSQL",
        "duration": "1-2 weeks",
        "action": "Persist users, CV analysis, and learning paths in PostgreSQL."
      }
    ],
    "confidence": 0.85
  }
}
```

> Array `roadmap` dan `skillGap` difilter berdasarkan role dengan skor kecocokan tertinggi.

### Response Tambahan dari Backend Web

Endpoint `POST /api/cvs` juga mengembalikan teks hasil ekstraksi PDF agar frontend dapat menampilkan output yang dibaca AI:

```json
{
  "fileName": "cv.pdf",
  "fileSize": 120000,
  "sourceFormat": "pdf",
  "extractedCvText": "Teks CV hasil parsing PDF...",
  "aiReadableText": "Biodata user...\n\nTeks CV hasil parsing PDF..."
}
```

---

## 2. Endpoint: Generate Rekomendasi (Learning Path)

Memberikan hasil akhir berupa peta jalan pembelajaran setelah menggabungkan hasil CV dan hasil quiz.

- **URL:** `POST /api/ai/recommendations`
- **Content-Type:** `application/json`

### Request Body (Web → AI)

Web mengirimkan skill hasil CV, target role yang dipilih, dan skor quiz:

```json
{
  "targetRole": "fullstack-web-developer",
  "extractedSkills": ["React", "Node.js", "Python", "Express"],
  "quizScore": 80
}
```

### Response Body (AI → Web)

AI menghitung ulang `readinessScore` berdasarkan bobot CV dan quiz, lalu memberikan rekomendasi:

```json
{
  "status": "success",
  "data": {
    "targetRole": "Junior Full-Stack Web Developer",
    "readinessScore": 78,
    "readinessLabel": "nearly ready",
    "skillGap": ["PostgreSQL", "Deployment", "Testing"],
    "careerRecommendation": {
      "title": "Junior Full-Stack Web Developer",
      "summary": "Kamu paling dekat dengan jalur Junior Full-Stack Web Developer.",
      "nextSteps": ["Rapikan CV", "Buat studi kasus proyek", "Latih cerita interview"]
    },
    "courseRecommendations": [
      {
        "skill": "PostgreSQL",
        "platform": "freeCodeCamp",
        "title": "Relational Database Certification",
        "url": "https://www.freecodecamp.org/learn/relational-database",
        "reason": "Menutup gap sebelum mengambil rekomendasi karier utama."
      },
      {
        "skill": "Deployment",
        "platform": "AWS Skill Builder",
        "title": "AWS Cloud Practitioner Essentials",
        "url": "https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials",
        "reason": "Mengenalkan cloud dan deployment sebelum publish project."
      },
      {
        "skill": "Communication",
        "platform": "TOEFL Preparation",
        "title": "TOEFL Speaking and Professional Communication",
        "url": "https://www.ets.org/toefl/test-takers/ibt/prepare.html",
        "reason": "Memperkuat bahasa Inggris dan komunikasi profesional."
      }
    ],
    "roadmap": [
      {
        "id": "step-1",
        "title": "Close PostgreSQL gap",
        "focus": "PostgreSQL",
        "duration": "1-2 weeks",
        "action": "Persist users, CV analysis, and learning paths in PostgreSQL."
      },
      {
        "id": "step-2",
        "title": "Close Deployment gap",
        "focus": "Deployment",
        "duration": "1-2 weeks",
        "action": "Deploy the frontend and API, then connect production environment variables."
      }
    ],
    "recommendation": [
      "Fokus penuhi kebutuhan Junior Full-Stack Web Developer sebelum melamar.",
      "Buat database schema di PostgreSQL.",
      "Coba deploy aplikasi ke VPS atau Cloud."
    ]
  }
}
```

---

## Catatan untuk Tim AI

1. **Array kosong:** Jika tidak ada skill yang terdeteksi, kembalikan array kosong `[]`, bukan `null`. Contoh: `"extractedSkills": []`.
2. **Error handling:** Jika terjadi error (teks terlalu panjang, format tidak valid, dsb.), kembalikan HTTP status `400` atau `500` dengan format berikut:
   ```json
   {
     "status": "error",
     "message": "Teks CV tidak valid atau gagal diproses."
   }
   ```
3. **Framework:** API ini dapat dibangun menggunakan Flask atau FastAPI. Web team akan memanggil URL endpoint yang diberikan (contoh: `http://localhost:8000/api/ai/...`).
