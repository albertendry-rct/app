require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = require('./src/database');
const { buatTransaksiQRIS, verifikasiWebhook, HARGA } = require('./src/midtrans');
const mqttService = require('./src/mqtt');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Konek MQTT saat server start
mqttService.connect();

// ================================
// DAFTAR MESIN
// ================================
const MESIN_VALID = ['M1', 'M2', 'M3', 'D1', 'D2', 'D3'];
// M = mesin cuci, D = dryer

// ================================
// ENDPOINT: Tablet minta QR baru
// ================================
app.post('/buat-transaksi', async (req, res) => {
  const { mesinId, menit } = req.body;

  // Validasi
  if (!MESIN_VALID.includes(mesinId)) {
    return res.status(400).json({ error: 'Mesin ID tidak valid' });
  }
  if (![30, 45, 60].includes(parseInt(menit))) {
    return res.status(400).json({ error: 'Durasi tidak valid' });
  }

  const orderId = `LDR-${mesinId}-${uuidv4().slice(0, 8).toUpperCase()}`;

  try {
    const transaksi = await buatTransaksiQRIS(orderId, mesinId, parseInt(menit));

    // Simpan ke DB
    db.simpan({
      orderId,
      mesinId,
      menit: parseInt(menit),
      harga: HARGA[parseInt(menit)],
    });

    res.json({
      orderId,
      qrUrl: transaksi.redirect_url,
      harga: transaksi.harga,
      menit: parseInt(menit),
      mesinId,
    });

  } catch (err) {
    console.error('Error buat transaksi:', err.message);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

// ================================
// ENDPOINT: Webhook dari Midtrans
// ================================
app.post('/webhook-midtrans', async (req, res) => {
  try {
    const notif = await verifikasiWebhook(req.body);
    const { order_id, transaction_status, fraud_status } = notif;

    console.log(`📩 Webhook: ${order_id} → ${transaction_status}`);

    const bayarSukses =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (bayarSukses) {
      const transaksi = await db.get(order_id);

      if (transaksi && transaksi.status === 'PENDING') {
        // Update DB
        db.updateStatus(order_id, 'DIBAYAR');

        // Nyalain mesin!
        mqttService.nyalakanMesin(transaksi.mesin_id, transaksi.menit);

        console.log(`✅ Mesin ${transaksi.mesin_id} dinyalakan ${transaksi.menit} menit`);
      }
    }

    res.status(200).json({ status: 'OK' });

  } catch (err) {
    console.error('Error webhook:', err.message);
    res.status(500).json({ error: 'Error proses webhook' });
  }
});

// ================================
// ENDPOINT: Tablet polling status
// ================================
app.get('/status/:orderId', async (req, res) => {
  const transaksi = await db.get(req.params.orderId);
  if (!transaksi) {
    return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  }
  res.json({
    status: transaksi.status,
    mesinId: transaksi.mesin_id,
    menit: transaksi.menit,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ================================
// START
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});