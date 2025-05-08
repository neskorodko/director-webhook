const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
app.use(express.json());
  require('dotenv').config();
+ const { Client } = require('pg');
+
+ // Підключення до Supabase/Postgres
+ const db = new Client({
+   connectionString: process.env.DATABASE_URL
+ });
+ db.connect().then(() => console.log('✅ Connected to DB'))
+   .catch(err => console.error('DB connection error', err));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'director_verify';

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

- app.post('/webhook', (req, res) => {
-   console.log('📩 Нове повідомлення:', JSON.stringify(req.body, null, 2));
-   res.sendStatus(200);
- });
+ app.post('/webhook', async (req, res) => {
+   try {
+     const entry = req.body.entry?.[0];
+     const msg   = entry?.messaging?.[0];
+
+     if (msg?.message && msg.sender?.id) {
+       const igId = msg.sender.id;
+       const text = msg.message.text || '';
+       const ts   = new Date(msg.timestamp);
+
+       // 1) upsert lead
+       await db.query(`
+         INSERT INTO leads (ig_id, first_seen)
+         VALUES ($1, $2)
+         ON CONFLICT (ig_id) DO NOTHING
+       `, [igId, ts]);
+
+       // 2) отримати lead_id
+       const { rows } = await db.query(
+         `SELECT id FROM leads WHERE ig_id = $1`, [igId]
+       );
+       const leadId = rows[0].id;
+
+       // 3) insert message
+       await db.query(`
+         INSERT INTO messages (lead_id, text, timestamp, direction)
+         VALUES ($1, $2, $3, 'inbound')
+       `, [leadId, text, ts]);
+
+       console.log('✔ Збережено повідомлення від', igId);
+     }
+   } catch (e) {
+     console.error('❌ Помилка збереження в БД', e);
+   }
+   res.sendStatus(200);
+ });

