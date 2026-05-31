# Legacy AI/ML Service

Folder ini adalah service Flask lama untuk eksperimen analisis CV. Jalur aplikasi aktif tidak memakai service ini.

Jalur aktif saat ini:

- Frontend: `apps/web`
- Backend utama: `../BE-Capstone`
- Service AI/model production: `../skillmap-ai`

Backend utama membaca `AI_SERVICE_URL` dari `../BE-Capstone/server.env` dan mengharapkan endpoint `POST /predict` sesuai kontrak di [`../../docs/contracts/AI_API_CONTRACT.md`](../../docs/contracts/AI_API_CONTRACT.md).

Endpoint lama di folder ini:

- `POST /api/ai/cv/analyze`
- `GET /health`
