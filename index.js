// index.js
const express = require('express');
require('dotenv').config();
const { Client } = require('pg');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Токен для валідації Webhook від Meta
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'director_verify';

// Instagram API токен
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// ID власного Instagram аккаунту (щоб не зберігати його як ліда)
const OWN_INSTAGRAM_ID = process.env.OWN_INSTAGRAM_ID;

// Функція для відправки повідомлення через Instagram API
async function sendInstagramMessage(recipientId, messageText) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ PAGE_ACCESS_TOKEN не встановлено');
    throw new Error('PAGE_ACCESS_TOKEN не встановлено');
  }

  try {
    const response = await fetch('https://graph.facebook.com/v18.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Помилка відправки повідомлення:', result);
      throw new Error(`Instagram API Error: ${result.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Повідомлення відправлено через Instagram API:', result);
    return result;
  } catch (error) {
    console.error('❌ Помилка при відправці повідомлення:', error);
    throw error;
  }
}

// Функція для отримання історії повідомлень з Instagram API
async function fetchInstagramMessageHistory(igId) {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ PAGE_ACCESS_TOKEN не встановлено');
    return [];
  }

  try {
    // Отримуємо conversation ID
    const conversationsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/conversations?platform=instagram&user_id=${igId}&access_token=${PAGE_ACCESS_TOKEN}`
    );
    
    const conversationsData = await conversationsResponse.json();
    
    if (!conversationsData.data || conversationsData.data.length === 0) {
      console.log('📭 Конверсація не знайдена для користувача:', igId);
      return [];
    }

    const conversationId = conversationsData.data[0].id;
    
    // Отримуємо повідомлення з конверсації
    const messagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${conversationId}?fields=messages{message,created_time,from}&access_token=${PAGE_ACCESS_TOKEN}`
    );
    
    const messagesData = await messagesResponse.json();
    
    if (!messagesData.messages || !messagesData.messages.data) {
      console.log('📭 Повідомлення не знайдені для конверсації:', conversationId);
      return [];
    }

    // Форматуємо повідомлення
    const formattedMessages = messagesData.messages.data.map(msg => ({
      text: msg.message,
      timestamp: new Date(msg.created_time),
      direction: msg.from.id === igId ? 'inbound' : 'outbound',
      instagram_message_id: msg.id
    }));

    console.log(`📨 Отримано ${formattedMessages.length} повідомлень з Instagram API для користувача ${igId}`);
    return formattedMessages;

  } catch (error) {
    console.error('❌ Помилка отримання історії повідомлень з Instagram:', error);
    return [];
  }
}

// Підключення до бази даних
const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/director',
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

      // Перевіряємо чи це не наш власний аккаунт
      if (OWN_INSTAGRAM_ID && igId === OWN_INSTAGRAM_ID) {
        console.log('🔄 Пропускаємо повідомлення від власного аккаунту:', igId);
        return res.sendStatus(200);
      }

      // 1) Upsert ліда (тільки якщо це не наш аккаунт)
      // Перевіряємо чи існують нові колонки
      try {
        await db.query(
          `INSERT INTO leads (ig_id, first_seen, status)
           VALUES ($1, $2, 'NEW')
           ON CONFLICT (ig_id) DO NOTHING`,
          [igId, ts]
        );
      } catch (insertError) {
        // Якщо помилка через відсутність колонки status, використовуємо стару схему
        if (insertError.code === '42703') { // column does not exist
          console.log('⚠️ Використовуємо стару схему БД без колонки status');
          await db.query(
            `INSERT INTO leads (ig_id, first_seen)
             VALUES ($1, $2)
             ON CONFLICT (ig_id) DO NOTHING`,
            [igId, ts]
          );
        } else {
          throw insertError;
        }
      }
      
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
    const { status } = req.query;
    
    // Спочатку перевіряємо чи існує колонка is_own_account
    let query = `
      SELECT id, ig_id, username, full_name, first_seen, status
      FROM leads
    `;
    
    // Додаємо умову для is_own_account тільки якщо колонка існує
    try {
      await db.query(`SELECT is_own_account FROM leads LIMIT 1`);
      query += ` WHERE (is_own_account IS FALSE OR is_own_account IS NULL)`;
    } catch (columnError) {
      console.log('⚠️ Колонка is_own_account не існує, пропускаємо фільтрацію');
      // Колонка не існує, продовжуємо без фільтрації
    }
    
    const params = [];
    
    // Фільтрація за статусом якщо передано
    if (status && status !== 'all') {
      const hasWhere = query.includes('WHERE');
      query += hasWhere ? ` AND status = $1` : ` WHERE status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY first_seen DESC`;
    
    console.log('🔍 Executing query:', query, 'with params:', params);
    const { rows } = await db.query(query, params);
    console.log('✅ Found', rows.length, 'leads');
    res.json(rows);
  } catch (e) {
    console.error('❌ Error in GET /leads:', e.message);
    console.error('Full error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      message: e.message,
      code: e.code 
    });
  }
});

// 2) Повернути чат конкретного ліда
app.get('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Отримуємо інформацію про ліда
    const leadResult = await db.query(
      'SELECT * FROM leads WHERE id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Отримуємо повідомлення ліда
    const messagesResult = await db.query(
      'SELECT * FROM messages WHERE lead_id = $1 ORDER BY timestamp ASC',
      [id]
    );

    res.json({
      lead: leadResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для шаблонів повідомлень
app.get('/templates', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM message_templates ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/templates', async (req, res) => {
  const { name, content, category } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO message_templates (name, content, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, content, category]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Error in POST /templates', e);
    res.status(500).send('Server error');
  }
});

app.put('/templates/:id', async (req, res) => {
  const { id } = req.params;
  const { name, content, category } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE message_templates
       SET name = $1, content = $2, category = $3
       WHERE id = $4
       RETURNING *`,
      [name, content, category, id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Error in PUT /templates/:id', e);
    res.status(500).send('Server error');
  }
});

app.delete('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM message_templates WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (e) {
    console.error('Error in DELETE /templates/:id', e);
    res.status(500).send('Server error');
  }
});

// Відправка повідомлень через Instagram API
app.post('/messages', async (req, res) => {
  try {
    const { lead_id, text, direction } = req.body;

    // Перевіряємо чи існує лід
    const leadExists = await db.query(
      'SELECT id FROM leads WHERE id = $1',
      [lead_id]
    );

    if (leadExists.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Зберігаємо повідомлення
    const result = await db.query(
      `INSERT INTO messages (lead_id, text, direction, timestamp)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING *`,
      [lead_id, text, direction]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Отримання списку статусів лідів
app.get('/lead-statuses', (req, res) => {
  const statuses = [
    { value: 'NEW', label: 'Новий', color: 'blue' },
    { value: 'CONTACTED', label: 'Контакт встановлено', color: 'yellow' },
    { value: 'QUALIFIED', label: 'Кваліфікований', color: 'purple' },
    { value: 'PROPOSAL', label: 'Пропозиція надіслана', color: 'orange' },
    { value: 'NEGOTIATION', label: 'Переговори', color: 'indigo' },
    { value: 'CLOSED_WON', label: 'Успішно закрито', color: 'green' },
    { value: 'CLOSED_LOST', label: 'Втрачено', color: 'red' },
    { value: 'ON_HOLD', label: 'На паузі', color: 'gray' },
    { value: 'FOLLOW_UP', label: 'Повторний контакт', color: 'pink' }
  ];
  
  res.json(statuses);
});

// API для шаблонів повідомлень
app.get('/templates', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, content, category, created_at, updated_at
      FROM message_templates
      ORDER BY category, name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Створення нового шаблону
app.post('/templates', async (req, res) => {
  try {
    const { name, content, category } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    const result = await db.query(`
      INSERT INTO message_templates (name, content, category)
      VALUES ($1, $2, $3)
      RETURNING id, name, content, category, created_at, updated_at
    `, [name, content, category || 'Загальне']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Оновлення шаблону
app.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, category } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    const result = await db.query(`
      UPDATE message_templates 
      SET name = $1, content = $2, category = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, content, category, created_at, updated_at
    `, [name, content, category || 'Загальне', id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Видалення шаблону
app.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM message_templates WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Оновлення статусу ліда
app.patch('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Валідація статусу
    const validStatuses = [
      'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION',
      'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD', 'FOLLOW_UP'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Функція для синхронізації історії повідомлень з Instagram
async function syncMessageHistory(leadId, igId) {
  try {
    // Отримуємо історію з Instagram API
    const instagramMessages = await fetchInstagramMessageHistory(igId);
    
    if (instagramMessages.length === 0) {
      return 0;
    }

    let syncedCount = 0;

    for (const msg of instagramMessages) {
      try {
        // Перевіряємо чи повідомлення вже існує
        const existingMessage = await db.query(
          'SELECT id FROM messages WHERE lead_id = $1 AND instagram_message_id = $2',
          [leadId, msg.instagram_message_id]
        );

        if (existingMessage.rows.length === 0) {
          // Додаємо нове повідомлення
          await db.query(
            `INSERT INTO messages (lead_id, text, direction, timestamp, instagram_message_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [leadId, msg.text, msg.direction, msg.timestamp, msg.instagram_message_id]
          );
          syncedCount++;
        }
      } catch (insertError) {
        console.error('❌ Помилка вставки повідомлення:', insertError);
      }
    }

    console.log(`✅ Синхронізовано ${syncedCount} нових повідомлень для ліда ${leadId}`);
    return syncedCount;

  } catch (error) {
    console.error('❌ Помилка синхронізації історії:', error);
    return 0;
  }
}

// Отримати повідомлення чату
app.get('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sync = 'false' } = req.query;
    
    // Отримуємо інформацію про ліда
    const leadResult = await db.query(
      'SELECT ig_id FROM leads WHERE id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Якщо потрібна синхронізація, спочатку синхронізуємо історію
    if (sync === 'true') {
      console.log('🔄 Синхронізація історії повідомлень для ліда:', id);
      await syncMessageHistory(id, lead.ig_id);
    }
    
    // Отримуємо повідомлення ліда
    const messagesResult = await db.query(
      `SELECT 
        m.id,
        m.text as content,
        m.timestamp,
        CASE 
          WHEN m.direction = 'outbound' THEN true 
          ELSE false 
        END as is_own
      FROM messages m
      WHERE m.lead_id = $1 
      ORDER BY m.timestamp ASC`,
      [id]
    );

    res.json({
      messages: messagesResult.rows,
      synced: sync === 'true'
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Відправка повідомлення в чат
app.post('/chats/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type = 'text' } = req.body;

    // Перевіряємо чи існує лід
    const leadExists = await db.query(
      'SELECT id, ig_id FROM leads WHERE id = $1',
      [id]
    );

    if (leadExists.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadExists.rows[0];
    const igId = lead.ig_id;

    // Спробуємо відправити повідомлення через Instagram API
    let instagramResult = null;
    let sendError = null;

    try {
      instagramResult = await sendInstagramMessage(igId, message);
      console.log('✅ Повідомлення успішно відправлено через Instagram API');
    } catch (error) {
      sendError = error;
      console.error('❌ Помилка відправки через Instagram API:', error.message);
    }

    // Зберігаємо повідомлення в БД незалежно від результату відправки
    const result = await db.query(
      `INSERT INTO messages (lead_id, text, direction, timestamp)
       VALUES ($1, $2, 'outbound', CURRENT_TIMESTAMP)
       RETURNING 
         id,
         text as content,
         timestamp,
         true as is_own`,
      [id, message]
    );

    // Повертаємо результат з інформацією про статус відправки
    const response = {
      ...result.rows[0],
      instagram_sent: !!instagramResult,
      instagram_error: sendError ? sendError.message : null
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint для синхронізації історії повідомлень
app.post('/chats/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Отримуємо інформацію про ліда
    const leadResult = await db.query(
      'SELECT ig_id, username FROM leads WHERE id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];
    
    console.log(`🔄 Початок синхронізації історії для ліда ${lead.username || lead.ig_id}`);
    
    const syncedCount = await syncMessageHistory(id, lead.ig_id);
    
    res.json({
      success: true,
      message: `Синхронізовано ${syncedCount} повідомлень`,
      syncedCount: syncedCount
    });

  } catch (error) {
    console.error('❌ Помилка синхронізації:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint для запуску міграцій
app.post('/admin/migrate', async (req, res) => {
  try {
    console.log('🔄 Запуск міграцій...');
    
    // Міграція 1: Додавання статусів та is_own_account
    try {
      await db.query(`
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'NEW';
      `);
      console.log('✅ Додано колонку status');
    } catch (e) {
      console.log('⚠️ Колонка status вже існує або помилка:', e.message);
    }

    try {
      await db.query(`
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_own_account BOOLEAN DEFAULT FALSE;
      `);
      console.log('✅ Додано колонку is_own_account');
    } catch (e) {
      console.log('⚠️ Колонка is_own_account вже існує або помилка:', e.message);
    }

    // Оновлення існуючих записів
    try {
      await db.query(`
        UPDATE leads SET status = 'NEW' WHERE status IS NULL OR status = '';
      `);
      console.log('✅ Оновлено статуси існуючих лідів');
    } catch (e) {
      console.log('⚠️ Помилка оновлення статусів:', e.message);
    }

    // Додавання constraint (може не спрацювати якщо вже існує)
    try {
      await db.query(`
        ALTER TABLE leads 
        ADD CONSTRAINT leads_status_check 
        CHECK (status IN (
          'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION',
          'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD', 'FOLLOW_UP'
        ));
      `);
      console.log('✅ Додано constraint для статусів');
    } catch (e) {
      console.log('⚠️ Constraint вже існує або помилка:', e.message);
    }

    // Додавання колонки для Instagram message ID
    try {
      await db.query(`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS instagram_message_id VARCHAR(255);
      `);
      console.log('✅ Додано колонку instagram_message_id');
    } catch (e) {
      console.log('⚠️ Колонка instagram_message_id вже існує або помилка:', e.message);
    }

    // Додавання індексів
    try {
      await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_is_own_account ON leads(is_own_account);`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_instagram_id ON messages(instagram_message_id);`);
      console.log('✅ Додано індекси');
    } catch (e) {
      console.log('⚠️ Індекси вже існують або помилка:', e.message);
    }

    console.log('🎉 Міграції завершено!');
    res.json({ 
      success: true, 
      message: 'Міграції успішно застосовано' 
    });
  } catch (error) {
    console.error('❌ Помилка міграції:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Privacy Policy endpoint
app.get('/privacy', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const privacyPath = path.join(__dirname, 'PRIVACY_POLICY.md');
    const content = fs.readFileSync(privacyPath, 'utf8');
    
    // Convert markdown to HTML for better display
    const htmlContent = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>');
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Privacy Policy - Director Admin Panel</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            h2 { color: #666; margin-top: 30px; }
            h3 { color: #888; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: 'Privacy policy not found' });
  }
});

// Terms of Service endpoint
app.get('/terms', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const termsPath = path.join(__dirname, 'TERMS_OF_SERVICE.md');
    const content = fs.readFileSync(termsPath, 'utf8');
    
    // Convert markdown to HTML for better display
    const htmlContent = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>');
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Terms of Service - Director Admin Panel</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            h2 { color: #666; margin-top: 30px; }
            h3 { color: #888; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: 'Terms of service not found' });
  }
});

// Health check endpoint  
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


