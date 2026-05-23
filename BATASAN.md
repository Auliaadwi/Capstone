# Batasan Proyek SkillMap

Dokumen ini menjelaskan batasan MVP SkillMap agar ruang lingkup demo, pengembangan, dan evaluasi tetap jelas.

## Batasan Fitur

- Aplikasi berfokus pada mahasiswa tingkat akhir dan fresh graduate yang ingin memetakan skill gap sebelum melamar kerja.
- Alur utama dibatasi pada upload CV PDF, profil singkat tambahan, job match, mini quiz, dan dashboard rekomendasi.
- Upload CV hanya mendukung file PDF. Format DOC, DOCX, gambar, dan tautan eksternal belum didukung.
- Profil singkat hanya berisi informasi yang belum masuk di CV, bukan data kontak seperti email, nomor WhatsApp, atau domisili.
- Target karier tidak dipilih manual di awal. Sistem menebak target role dari isi CV, posisi yang dicari, skill tambahan, dan profil singkat.
- Mini quiz masih berbentuk pertanyaan YES/NO sederhana untuk menentukan cabang rekomendasi karier atau e-course.
- Fitur akun, riwayat user lintas perangkat, notifikasi, dan export laporan belum termasuk dalam MVP.

## Batasan AI dan Data

- Analisis skill saat ini masih berbasis service rekomendasi deterministik dan kontrak integrasi AI, belum model machine learning final.
- Akurasi hasil bergantung pada kelengkapan biodata, kualitas teks CV, dan cakupan taxonomy skill yang tersedia.
- Sistem belum melakukan validasi mendalam terhadap kebenaran klaim skill di CV.
- Dataset industri, job description, dan mapping skill masih dapat diperluas oleh tim AI/Data Science.
- Rekomendasi learning path bersifat panduan awal, bukan keputusan final kelayakan kerja.

## Batasan Backend dan Penyimpanan

- Backend berjalan sebagai REST API Flask dengan fallback penyimpanan memory jika PostgreSQL belum dikonfigurasi.
- Data di memory fallback akan hilang saat server dimatikan.
- Autentikasi, otorisasi role user, rate limiting, dan audit log production belum diimplementasikan.
- Endpoint dibuat untuk kebutuhan demo MVP dan masih perlu hardening sebelum produksi.

## Batasan Frontend

- UI dirancang untuk demo web responsif desktop dan mobile.
- Validasi form masih berfokus pada kelengkapan data wajib, belum validasi domain bisnis yang kompleks.
- Dashboard menampilkan ringkasan rekomendasi dan insight utama, belum menyediakan visualisasi analitik lengkap.

## Batasan Privasi dan Keamanan

- Pengguna sebaiknya tidak mengunggah CV dengan data sensitif berlebihan saat demo publik.
- Belum ada enkripsi file upload di storage karena file tidak disimpan sebagai dokumen permanen pada MVP.
- Deployment production harus menambahkan HTTPS, konfigurasi CORS ketat, secret management, validasi upload yang lebih kuat, dan kebijakan retensi data.

## Di Luar Ruang Lingkup MVP

- Integrasi langsung dengan platform lowongan kerja.
- Interview simulator berbasis AI.
- Pembayaran, sertifikasi, atau marketplace course.
- Penilaian psikometri atau asesmen kompetensi formal.
- Rekomendasi gaji dan prediksi diterima kerja.
