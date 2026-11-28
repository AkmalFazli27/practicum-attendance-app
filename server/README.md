# Server pembayaran TapIn (Midtrans Sandbox)

Environment (jangan di-commit): `MIDTRANS_SERVER_KEY` (Sandbox) dan
`FIREBASE_SERVICE_ACCOUNT` (isi file JSON service account).

Jalankan: `npm install`, lalu `npm start` (Node 20+).

Endpoint: `POST /pembayaran/buat`, `/pembayaran/webhook`, `/pembayaran/sinkron`.
Notification URL di dashboard Sandbox: `https://<domain>/pembayaran/webhook`.
