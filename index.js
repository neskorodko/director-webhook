// index.js
const express = require('express');
require('dotenv').config();
const { Client } = require('pg');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const app = express();
const cors = require('cors');
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Токен для валідації Webhook від Meta
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'director_verify';

// Підключення до Supabase/Postgres
const db = new Client({
  connectionString: process.env.DATABASE_URL,
});
db.connect()
  .then(() => console.log('✅ Connected to DB'))
  .catch(err => console.error('❌ DB connection error', err));

// Валідація Webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Підтверджено Webhook!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Обробка нових подій з Direct / Messenger
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const msg = entry?.messaging?.[0];

    if (msg?.message && msg.sender?.id) {
      const igId = msg.sender.id;
      const text = msg.message.text || '';
      const ts = new Date(msg.timestamp);

      // 1) Upsert ліда
      await db.query(
        `INSERT INTO leads (ig_id, first_seen)
         VALUES ($1, $2)
         ON CONFLICT (ig_id) DO NOTHING`,
        [igId, ts]
      );
      
      // 2) Підтягнути username і full_name через Graph API
     const { rows: exist } = await db.query(
  `SELECT username FROM leads WHERE ig_id = $1`, [igId]
);
if (!exist[0].username) {
  const profile = await fetch(
    `https://graph.facebook.com/${igId}` +
    `?fields=username,name&access_token=${PAGE_ACCESS_TOKEN}`
  ).then(r => r.json());
  if (profile.username) {
    await db.query(`
      UPDATE leads
         SET username  = $1,
             full_name = $2
       WHERE ig_id = $3
    `, [profile.username, profile.name, igId]);
  }
}
      // 2) Отримати lead_id
      const { rows } = await db.query(
        `SELECT id FROM leads WHERE ig_id = $1`,
        [igId]
      );
      const leadId = rows[0].id;

      // 3) Зберегти повідомлення
      await db.query(
        `INSERT INTO messages (lead_id, text, timestamp, direction)
         VALUES ($1, $2, $3, 'inbound')`,
        [leadId, text, ts]
      );

      console.log('✔ Збережено повідомлення від', igId);
    }
  } catch (e) {
    console.error('❌ Помилка збереження в БД', e);
  }
  res.sendStatus(200);
});

// … у вашому index.js, після app.post('/webhook') …

// 1) Повернути весь список лідів
app.get('/leads', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, ig_id, username, full_name, first_seen, status
      FROM leads
      ORDER BY first_seen DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('Error in GET /leads', e);
    res.status(500).send('Server error');
  }
});

// 2) Повернути чат конкретного ліда
app.get('/leads/:id', async (req, res) => {
  const leadId = req.params.id;
  try {
    const lead  = await db.query(`SELECT * FROM leads WHERE id = $1`, [leadId]);
    const msgs  = await db.query(
      `SELECT text, timestamp, direction
         FROM messages
        WHERE lead_id = $1
     ORDER BY timestamp`, [leadId]
    );
    res.json({ lead: lead.rows[0], messages: msgs.rows });
  } catch (e) {
    console.error('Error in GET /leads/:id', e);
    res.status(500).send('Server error');
  }
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер працює на порті ${PORT}`);
});


