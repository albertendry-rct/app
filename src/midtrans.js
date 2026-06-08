const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const HARGA = {
  30: parseInt(process.env.HARGA_30),
  45: parseInt(process.env.HARGA_45),
  60: parseInt(process.env.HARGA_60),
};

async function buatTransaksiQRIS(orderId, mesinId, menit) {
  const harga = HARGA[menit];
  if (!harga) throw new Error('Durasi tidak valid');

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: harga,
    },
    payment_type: 'qris',
    item_details: [{
      id: `mesin-${mesinId}`,
      price: harga,
      quantity: 1,
      name: `Laundry Mesin ${mesinId} - ${menit} Menit`,
    }],
    expiry: {
      unit: 'minutes',
      duration: 10, // QR expired 10 menit
    },
  };

  const transaksi = await snap.createTransaction(parameter);
  return { ...transaksi, harga };
}

// Verifikasi webhook dari Midtrans — WAJIB, jangan skip!
async function verifikasiWebhook(notif) {
  return await snap.transaction.notification(notif);
}

module.exports = { buatTransaksiQRIS, verifikasiWebhook, HARGA };