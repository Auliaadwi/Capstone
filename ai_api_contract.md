# 📜 Kontrak API SkillMap (Web <-> AI)

Dokumen ini adalah standar komunikasi (API Contract) antara sistem Web (Full-Stack) dan sistem AI. Karena tim AI akan men-deploy model di server sebagai API (Flask/FastAPI), maka format data (JSON) wajib mengikuti struktur di bawah ini agar Frontend dan Backend bisa memproses datanya tanpa error.

---

## 1. Endpoint: Ekstraksi & Analisis CV
**Tujuan:** Menerima teks CV, mendeteksi skill, dan memetakan tingkat kecocokan (Readiness Score) terhadap daftar lowongan/pekerjaan yang ada.

- **URL:** `POST /api/ai/analyze-cv`
- **Content-Type:** `application/json`

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
