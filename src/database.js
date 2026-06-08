const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../laundry.db'));

// Buat tabel
db.exec(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    TEXT UNIQUE NOT NULL,
    mesin_id    TEXT NOT NULL,
    menit       INTEGER NOT NULL,
    harga       INTEGER NOT NULL,
    status      TEXT DEFAULT 'PENDING',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function simpan({ orderId, mesinId, menit, harga }) {
  db.prepare(`
    INSERT INTO transaksi (order_id, mesin_id, menit, harga)
    VALUES (?, ?, ?, ?)
  `).run(orderId, mesinId, menit, harga);
}

function updateStatus(orderId, status) {
  db.prepare(`UPDATE transaksi SET status = ? WHERE order_id = ?`)
    .run(status, orderId);
}

function get(orderId) {
  return db.prepare(`SELECT * FROM transaksi WHERE order_id = ?`)
    .get(orderId);
}

module.exports = { simpan, updateStatus, get };