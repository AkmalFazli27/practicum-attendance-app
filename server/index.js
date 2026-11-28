// Backend pembayaran TapIn (Midtrans SANDBOX saja).
import crypto from 'node:crypto';
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const { MIDTRANS_SERVER_KEY, FIREBASE_SERVICE_ACCOUNT, PORT = 3000 } = process.env;
if (!MIDTRANS_SERVER_KEY || !FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('MIDTRANS_SERVER_KEY dan FIREBASE_SERVICE_ACCOUNT wajib diisi.');
}

initializeApp({ credential: cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

const SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
const API_URL = 'https://api.sandbox.midtrans.com/v2';
const AUTH = 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
const SATU_HARI = 24 * 60 * 60 * 1000;
const sekarang = () => new Date().toISOString();

const galat = (res, kode, alasan) => res.status(kode).json({ ok: false, alasan });

async function wajibLogin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    req.uid = (await getAuth().verifyIdToken(token)).uid;
    next();
  } catch {
    galat(res, 401, 'TIDAK_BERHAK');
  }
}

async function kirimPush(uid, title, body, data) {
  try {
    const user = await db.doc(`users/${uid}`).get();
    const to = user.get('pushToken');
    if (!to) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, title, body, data, sound: 'default' }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error('Push gagal:', e.message);
  }
}

function petakanStatus({ transaction_status: s, fraud_status: f }) {
  if (s === 'settlement' || s === 'capture') {
    if (!f || f === 'accept') return 'success';
    return f === 'deny' ? 'failed' : 'pending';
  }
  if (s === 'pending') return 'pending';
  if (['deny', 'cancel', 'expire', 'failure'].includes(s)) return 'failed';
  return null; // status lain (mis. refund) di luar cakupan
}

// Satu-satunya tempat status pembayaran diubah. Idempoten.
async function terapkanStatus(orderId, info) {
  const baru = petakanStatus(info);
  const refBayar = db.doc(`pembayaran/${orderId}`);

  const perubahan = await db.runTransaction(async (tx) => {
    const bayar = (await tx.get(refBayar)).data();
    if (!bayar || !baru) return null;
    if (info.gross_amount !== undefined && Number(info.gross_amount) !== bayar.nominal) {
      throw new Error('NOMINAL_TIDAK_COCOK');
    }
    // success bersifat final; failed tidak kembali ke pending.
    if (bayar.status === 'success' || bayar.status === baru) return null;
    if (bayar.status === 'failed' && baru === 'pending') return null;

    const refTagihan = db.doc(`tagihan/${bayar.tagihanId}`);
    const tagihan = (await tx.get(refTagihan)).data();
    if (!tagihan) return null;
    const izin = await tx.get(db.doc(`izin/${tagihan.sesiId}_${tagihan.praktikanId}`));

    tx.update(refBayar, {
      status: baru,
      statusMidtrans: info.transaction_status,
      ...(info.payment_type ? { metode: info.payment_type } : {}),
      diperbaruiPada: sekarang(),
    });

    const selesai = ['PAID', 'DIBEBASKAN'].includes(tagihan.status);
    if (!selesai && baru === 'success') {
      tx.update(refTagihan, { status: 'PAID', dibayarPada: sekarang() });
    } else if (!selesai && tagihan.orderId === orderId) {
      if (baru === 'pending') {
        tx.update(refTagihan, { status: 'PENDING' });
      } else if (izin.get('status') === 'DITERIMA') {
        tx.update(refTagihan, { status: 'DIBEBASKAN', izinId: izin.id });
      } else {
        tx.update(refTagihan, { status: 'FAILED' });
      }
    }
    return { status: baru, uid: bayar.praktikanId, tagihanId: bayar.tagihanId };
  });

  if (perubahan && perubahan.status !== 'pending') {
    const sukses = perubahan.status === 'success';
    await kirimPush(
      perubahan.uid,
      sukses ? 'Pembayaran berhasil' : 'Pembayaran gagal',
      sukses ? 'Pembayaran dendamu sudah diterima.' : 'Pembayaran dendamu gagal. Coba bayar ulang.',
      { jenis: sukses ? 'PEMBAYARAN_BERHASIL' : 'PEMBAYARAN_GAGAL', tagihanId: perubahan.tagihanId },
    );
  }
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (_req, res) => res.send('TapIn payment server OK'));

app.post('/pembayaran/buat', wajibLogin, async (req, res) => {
  const { tagihanId } = req.body || {};
  if (typeof tagihanId !== 'string' || !tagihanId || tagihanId.includes('/')) {
    return galat(res, 400, 'TAGIHAN_TIDAK_DITEMUKAN');
  }
  const refTagihan = db.doc(`tagihan/${tagihanId}`);
  const orderId = `TPN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  try {
    // Pesan tempat dulu supaya dua ketukan tidak membuat dua transaksi.
    const hasil = await db.runTransaction(async (tx) => {
      const t = (await tx.get(refTagihan)).data();
      if (!t) return { kode: 404, alasan: 'TAGIHAN_TIDAK_DITEMUKAN' };
      if (t.praktikanId !== req.uid) return { kode: 403, alasan: 'TIDAK_BERHAK' };
      if (t.status === 'PAID') return { kode: 409, alasan: 'SUDAH_LUNAS' };
      if (t.status === 'DIBEBASKAN') return { kode: 409, alasan: 'TIDAK_BERHAK' };
      if (t.status === 'PENDING' && t.orderId) {
        const lama = (await tx.get(db.doc(`pembayaran/${t.orderId}`))).data();
        if (lama?.redirectUrl) return { redirectUrl: lama.redirectUrl, orderId: t.orderId };
        if (lama && Date.now() - Date.parse(lama.dibuatPada) < 60000) {
          return { kode: 409, alasan: 'SERVER_ERROR' };
        }
      }
      if (!Number.isInteger(t.nominal) || t.nominal <= 0) {
        return { kode: 422, alasan: 'SERVER_ERROR' };
      }
      tx.create(db.doc(`pembayaran/${orderId}`), {
        tagihanId,
        praktikanId: t.praktikanId,
        nominal: t.nominal,
        status: 'pending',
        statusMidtrans: 'dibuat',
        dibuatPada: sekarang(),
        diperbaruiPada: sekarang(),
      });
      tx.update(refTagihan, { status: 'PENDING', orderId });
      return { baru: true, nominal: t.nominal };
    });

    if (hasil.alasan) return galat(res, hasil.kode, hasil.alasan);
    if (!hasil.baru) return res.json({ ok: true, ...hasil });

    let snap;
    try {
      const r = await fetch(SNAP_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: AUTH },
        body: JSON.stringify({
          transaction_details: { order_id: orderId, gross_amount: hasil.nominal },
        }),
        signal: AbortSignal.timeout(15000),
      });
      snap = await r.json();
      if (!r.ok || !snap.redirect_url) throw new Error(JSON.stringify(snap));
    } catch (e) {
      await terapkanStatus(orderId, { transaction_status: 'failure' });
      throw e;
    }

    await db.doc(`pembayaran/${orderId}`).update({ redirectUrl: snap.redirect_url });
    res.json({ ok: true, redirectUrl: snap.redirect_url, orderId });
  } catch (e) {
    console.error('buat:', e.message);
    galat(res, 500, 'SERVER_ERROR');
  }
});

app.post('/pembayaran/webhook', async (req, res) => {
  const n = req.body || {};
  const harapan = crypto
    .createHash('sha512')
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  const kiriman = String(n.signature_key || '');
  if (
    kiriman.length !== harapan.length ||
    !crypto.timingSafeEqual(Buffer.from(kiriman), Buffer.from(harapan))
  ) {
    return res.status(403).send('signature salah');
  }
  // Order tak dikenal (mis. tombol tes dashboard) cukup dijawab 200.
  if (!/^TPN-[\w-]+$/.test(n.order_id)) return res.send('diabaikan');
  try {
    const info = n.status_code !== '200' && petakanStatus(n) === 'success'
      ? { ...n, transaction_status: 'pending' }
      : n;
    await terapkanStatus(n.order_id, info);
    res.send('OK');
  } catch (e) {
    console.error('webhook:', e.message);
    res.status(e.message === 'NOMINAL_TIDAK_COCOK' ? 400 : 500).send('gagal');
  }
});

app.post('/pembayaran/sinkron', wajibLogin, async (req, res) => {
  const { orderId } = req.body || {};
  if (typeof orderId !== 'string' || !/^TPN-[\w-]+$/.test(orderId)) {
    return galat(res, 400, 'TAGIHAN_TIDAK_DITEMUKAN');
  }
  try {
    const bayar = (await db.doc(`pembayaran/${orderId}`).get()).data();
    if (!bayar) return galat(res, 404, 'TAGIHAN_TIDAK_DITEMUKAN');
    if (bayar.praktikanId !== req.uid) return galat(res, 403, 'TIDAK_BERHAK');

    const r = await fetch(`${API_URL}/${orderId}/status`, {
      headers: { Accept: 'application/json', Authorization: AUTH },
      signal: AbortSignal.timeout(15000),
    });
    const info = await r.json();
    if (String(info.status_code) === '404') {
      // Belum memilih metode bayar. Setelah 24 jam dianggap kedaluwarsa.
      if (Date.now() - Date.parse(bayar.dibuatPada) > SATU_HARI) {
        await terapkanStatus(orderId, { transaction_status: 'expire' });
      }
    } else if (info.transaction_status) {
      await terapkanStatus(orderId, info);
    } else {
      throw new Error(JSON.stringify(info));
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('sinkron:', e.message);
    galat(res, 500, 'SERVER_ERROR');
  }
});

app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
