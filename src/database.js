// Simple in-memory storage — no SQLite needed
const transaksi = {};

function simpan({ orderId, mesinId, menit, harga }) {
  transaksi[orderId] = {
    order_id: orderId,
    mesin_id: mesinId,
    menit,
    harga,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
}

function updateStatus(orderId, status) {
  if (transaksi[orderId]) {
    transaksi[orderId].status = status;
  }
}

function get(orderId) {
  return transaksi[orderId] || null;
}

module.exports = { simpan, updateStatus, get };