// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// DB init
const db = new sqlite3.Database('./guestbook.db', (err) => {
  if (err) return console.error('DB error:', err.message);
  console.log('✅ Connected to SQLite database.');
});

// Buat tabel jika belum ada
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Endpoint POST untuk tambah pesan
app.post('/guestbook', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message required.' });
  }
  db.run(
    `INSERT INTO messages (name, message) VALUES (?, ?)`,
    [name, message],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ id: this.lastID });
    }
  );
});

// Endpoint GET untuk ambil semua pesan
app.get('/guestbook', (req, res) => {
  db.all(`SELECT * FROM messages ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
