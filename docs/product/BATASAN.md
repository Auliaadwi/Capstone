# Batasan Proyek SkillMap

Dokumen ini menjelaskan batasan MVP SkillMap agar ruang lingkup demo, pengembangan, dan evaluasi tetap jelas.

## Batasan Fitur

- Aplikasi ditujukan untuk mahasiswa tingkat akhir dan fresh graduate yang ingin mengetahui skill gap mereka sebelum melamar kerja.
- Alur utama mencakup: upload CV PDF, profil singkat tambahan, job match, mini quiz, dan dashboard rekomendasi.
- Upload CV hanya mendukung format PDF. Format DOC, DOCX, gambar, dan tautan eksternal belum didukung.
- Profil singkat hanya berisi informasi yang belum tercantum di CV — bukan data kontak seperti email, nomor telepon, atau domisili.
- Target karier tidak dipilih manual di awal. Sistem menyimpulkan role yang paling sesuai dari isi CV, posisi yang dicari, skill tambahan, dan profil singkat.
- Mini quiz membandingkan beberapa role teratas hasil job match untuk memvalidasi minat karier pengguna.
- Fitur akun, riwayat lintas perangkat, notifikasi, dan export laporan belum termasuk dalam MVP.

## Batasan AI dan Data

- Analisis skill saat ini masih berbasis service rekomendasi deterministik dan kontrak integrasi AI, belum model machine learning final.
- Akurasi hasil bergantung pada kelengkapan biodata, kualitas teks CV, dan cakupan taxonomy skill yang tersedia.
- Sistem belum melakukan validasi mendalam terhadap kebenaran klaim skill di dalam CV.
- Dataset industri, job description, dan mapping skill masih dapat diperluas oleh tim AI/Data Science.
- Rekomendasi learning path bersifat panduan awal, bukan penilaian final kelayakan kerja.

## Batasan Backend dan Penyimpanan

- Backend berjalan sebagai REST API Flask dengan fallback penyimpanan in-memory jika PostgreSQL belum dikonfigurasi.
- Data di in-memory fallback akan hilang saat server dimatikan.
- Autentikasi user penuh, otorisasi berbasis role, rate limiting, dan audit log production belum diimplementasikan.
- Endpoint dibuat untuk kebutuhan demo MVP dan masih perlu hardening sebelum digunakan di lingkungan produksi.

## Batasan Frontend

- UI dirancang untuk demo web yang responsif di desktop dan mobile.
- Validasi form berfokus pada kelengkapan data wajib, belum mencakup validasi domain bisnis yang kompleks.
- Dashboard menampilkan ringkasan rekomendasi dan insight utama, belum menyediakan visualisasi analitik lengkap.

## Batasan Privasi dan Keamanan

- Pengguna sebaiknya tidak mengunggah CV dengan data yang terlalu sensitif saat demo publik.
- File upload tidak disimpan sebagai dokumen permanen pada tahap MVP, sehingga enkripsi storage belum diterapkan.
- Deployment produksi harus menambahkan: HTTPS, konfigurasi CORS yang ketat, secret management, validasi upload yang lebih kuat, dan kebijakan retensi data yang jelas.

## Di Luar Ruang Lingkup MVP

- Integrasi langsung dengan platform lowongan kerja
- Interview simulator berbasis AI
- Pembayaran, sertifikasi, atau marketplace kursus
- Penilaian psikometri atau asesmen kompetensi formal
- Prediksi gaji dan kemungkinan diterima kerja
