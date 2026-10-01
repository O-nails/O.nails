const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({ bookings: [] }, null, 2));
}

app.use(express.json({ limit: "100kb" }));
app.use(express.static(ROOT));

function readBookings() {
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.bookings) ? data.bookings : [];
  } catch {
    return [];
  }
}

function writeBookings(bookings) {
  const temp = `${BOOKINGS_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify({ bookings }, null, 2));
  fs.renameSync(temp, BOOKINGS_FILE);
}

app.get("/api/booked-dates", (req, res) => {
  const bookings = readBookings();
  res.set("Cache-Control", "no-store");
  res.json({ dates: [...new Set(bookings.map(b => b.date))] });
});

app.post("/api/book", (req, res) => {
  const { name, date, time, length, design, removal, correction, comment } = req.body || {};

  if (!name || !date || !length) {
    return res.status(400).json({ error: "Заполните имя, дату и длину." });
  }

  // ISO date validation.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Некорректная дата." });
  }

  const bookings = readBookings();

  // One booking per calendar date, as requested.
  if (bookings.some(b => b.date === date)) {
    return res.status(409).json({ error: "Дата уже занята." });
  }

  const booking = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    name: String(name).slice(0, 100),
    date,
    time: String(time || "").slice(0, 100),
    length: String(length).slice(0, 30),
    design: String(design || "").slice(0, 1000),
    removal: String(removal || "").slice(0, 10),
    correction: String(correction || "").slice(0, 10),
    comment: String(comment || "").slice(0, 1000)
  };

  bookings.push(booking);
  writeBookings(bookings);

  res.status(201).json({ ok: true, bookingId: booking.id });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`O.nails running on http://localhost:${PORT}`);
});
