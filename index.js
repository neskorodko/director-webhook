const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
app.use(express.json());

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

app.post('/webhook', (req, res) => {
  console.log('📩 Нове повідомлення:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер працює на порті ${PORT}`);
});
