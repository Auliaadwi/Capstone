# Struktur Proyek Frontend

`Capstone` adalah workspace frontend SkillMap. Source of truth backend Flask ada di `../BE-Capstone`.

```
Capstone/
├── apps/
│   └── web/              # Aplikasi React + Vite
│       ├── src/          # UI, API client, Supabase client, dan styles
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── .env.example
├── docs/                 # Dokumentasi frontend dan referensi API
├── package.json          # Script convenience frontend
└── README.md
```

## Lokasi Pengerjaan

| Kebutuhan | Lokasi |
|-----------|--------|
| UI, halaman, state, dan styles | `apps/web/src` |
| Request API ke backend | `apps/web/src/api.js` |
| Supabase browser client | `apps/web/src/supabaseClient.js` |
| Konfigurasi package dan Vite | `apps/web/package.json`, `apps/web/vite.config.js` |
| Template environment | `apps/web/.env.example` |

## Pemisahan Repo

- Pekerjaan backend API → `../BE-Capstone`
- Pekerjaan model AI → repo tim AI (di luar scope frontend)
- Frontend hanya berkomunikasi ke backend melalui `VITE_API_URL`

## Aturan Penempatan File

- Kode khusus frontend hanya di dalam `apps/web`
- Secret backend tidak boleh ada di workspace ini
- Folder `node_modules`, build output, dan file `.env` lokal tidak dimasukkan ke git
