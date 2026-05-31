# 📜 Kontrak API SkillMap (Web <-> AI)

Dokumen ini adalah standar komunikasi (API Contract) antara sistem Web (Full-Stack) dan sistem AI. Karena tim AI akan men-deploy model di server sebagai API (Flask/FastAPI), maka format data (JSON) wajib mengikuti struktur di bawah ini agar Frontend dan Backend bisa memproses datanya tanpa error.

---

## 1. Endpoint: Ekstraksi & Analisis CV
**Tujuan:** Menerima teks CV, mendeteksi skill, dan memetakan tingkat kecocokan (Readiness Score) terhadap daftar lowongan/pekerjaan yang ada.

- **URL:** `POST /api/ai/analyze-cv`
- **Content-Type:** `application/json`

**Catatan implementasi web:** upload CV dari frontend wajib berupa PDF (`.pdf`) lewat `POST /api/cvs` dengan `multipart/form-data`. Backend menolak file non-PDF, mengekstrak isi PDF menjadi teks, lalu teks inilah yang dikirim/dibaca oleh AI. Endpoint lama `POST /api/cv/upload` masih tersedia sebagai alias kompatibilitas.

### 📥 Request Body (Dari Web ke AI)
Web akan mengirimkan teks CV mentah (hasil OCR atau parse PDF di backend utama) ke AI.
```json
{
  "text": "Saya adalah lulusan Teknik Informatika dengan pengalaman menggunakan React, Node.js, dan Python. Pernah membuat project API menggunakan Express.",
  "domain": "technology"
}
```

### 📤 Response Body (Dari AI ke Web)
AI wajib mengembalikan daftar skill yang terdeteksi, serta rekomendasi role/pekerjaan terbaik.
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
*(Catatan buat AI: Array `roadmap` dan `skillGap` difilter berdasarkan role yang skor kecocokannya paling tinggi).*

### Response Tambahan dari Backend Web
Endpoint `POST /api/cvs` juga mengembalikan teks hasil ekstraksi PDF agar frontend bisa menampilkan output yang dibaca AI.
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
**Tujuan:** Memberikan hasil akhir (Peta Jalan Pembelajaran) setelah menggabungkan hasil CV dan hasil Kuis.

- **URL:** `POST /api/ai/recommendations`
- **Content-Type:** `application/json`

### 📥 Request Body (Dari Web ke AI)
Web akan mengirimkan data skill hasil CV, target role yang dipilih user, dan skor kuis yang baru saja dikerjakan.
```json
{
  "targetRole": "fullstack-web-developer",
  "extractedSkills": ["React", "Node.js", "Python", "Express"],
  "quizScore": 80
}
```

### 📤 Response Body (Dari AI ke Web)
AI wajib menghitung ulang `readinessScore` (Kesiapan) berdasarkan bobot CV dan Kuis, lalu memberikan rekomendasi.
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

## 💡 Notes untuk Tim AI:
1. **Struktur Data Kosong:** Jika tidak ada skill yang terdeteksi, tolong tetap kembalikan array kosong `[]`, **jangan** dikembalikan sebagai `null`. (Contoh: `"extractedSkills": []`).
2. **Error Handling:** Jika terjadi error (misal teks kepanjangan/invalid), tolong kembalikan HTTP Status `400` atau `500` dengan format:
   ```json
   {
     "status": "error",
     "message": "Teks CV tidak valid atau gagal diproses."
   }
   ```
3. **Framework:** Silakan bangun API ini menggunakan **Flask** atau **FastAPI**. Web team akan nembak URL endpoint yang kalian kasih (misal `http://localhost:8000/api/ai/...`).
