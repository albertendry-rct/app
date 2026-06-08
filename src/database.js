const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../laundry.db'));

// Buat tabel
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transaksi (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    TEXT UNIQUE NOT NULL,
      mesin_id    TEXT NOT NULL,
      menit       INTEGER NOT NULL,
      harga       INTEGER NOT NULL,
      status      TEXT DEFAULT 'PENDING',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

function simpan({ orderId, mesinId, menit, harga }) {
  db.run(
    `INSERT INTO transaksi (order_id, mesin_id, menit, harga) VALUES (?, ?, ?, ?)`,
    [orderId, mesinId, menit, harga]
  );
}

function updateStatus(orderId, status) {
  db.run(`UPDATE transaksi SET status = ? WHERE order_id = ?`, [status, orderId]);
}

function get(orderId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM transaksi WHERE order_id = ?`, [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = { simpan, updateStatus, get };