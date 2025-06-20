# Director Webhook Server

Instagram Direct webhook сервер для обробки повідомлень та управління лідами.

## 🚀 Особливості

- **Instagram API інтеграція** - отримання та відправка повідомлень
- **PostgreSQL база даних** - зберігання лідів та повідомлень
- **RESTful API** - для фронтенд додатку
- **Webhook обробка** - реальний час обробки повідомлень
- **Шаблони повідомлень** - готові відповіді

## 🛠 Технології

- Node.js
- Express.js
- PostgreSQL
- Instagram Graph API
- CORS
- node-fetch

## 📦 Встановлення

### 1. Клонування репозиторію
```bash
git clone https://github.com/neskorodko/director-webhook.git
cd director-webhook
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування змінних середовища

Створіть `.env` файл:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/director

# Instagram API
VERIFY_TOKEN=your_verify_token
PAGE_ACCESS_TOKEN=your_page_access_token

# Server
PORT=3000
```

### 4. Налаштування бази даних

Виконайте міграції з папки `migrations/`:

```sql
-- 000_init.sql
-- 001_create_templates.sql
```

## 🚀 Запуск

### Розробка
```bash
npm start
```

Сервер буде доступний на `http://localhost:3000`

### Продакшн
```bash
NODE_ENV=production npm start
```

## 🔧 API Endpoints

### Webhook
- `GET /webhook` - верифікація webhook
- `POST /webhook` - обробка вхідних повідомлень

### Ліди
- `GET /leads` - отримати список лідів
- `GET /leads/:id` - отримати конкретного ліда
- `PATCH /leads/:id` - оновити статус ліда

### Чати
- `GET /chats/:id` - отримати повідомлення чату
- `POST /chats/:id/send` - відправити повідомлення

### Шаблони
- `GET /templates` - отримати шаблони повідомлень
- `POST /templates` - створити новий шаблон
- `PUT /templates/:id` - оновити шаблон
- `DELETE /templates/:id` - видалити шаблон

## 📱 Структура бази даних

### Таблиця `leads`
- `id` - унікальний ідентифікатор
- `ig_id` - Instagram ID користувача
- `username` - Instagram username
- `full_name` - повне ім'я
- `first_seen` - дата першого контакту
- `status` - статус ліда

### Таблиця `messages`
- `id` - унікальний ідентифікатор
- `lead_id` - посилання на ліда
- `text` - текст повідомлення
- `direction` - напрямок (inbound/outbound)
- `timestamp` - час повідомлення

### Таблиця `message_templates`
- `id` - унікальний ідентифікатор
- `name` - назва шаблону
- `content` - зміст шаблону
- `category` - категорія

## 🔐 Безпека

- Верифікація webhook токенів
- Валідація всіх вхідних даних
- Обробка помилок API
- Захист від SQL ін'єкцій

## 📊 Логування

Сервер логує всі важливі події:
- Отримання повідомлень
- Відправка повідомлень
- Помилки API
- Підключення до БД

## 🚀 Розгортання

### Render.com
1. Підключіть GitHub репозиторій
2. Встановіть змінні середовища
3. Виберіть Node.js середовище
4. Розгорніть сервіс

### Heroku
```bash
heroku create your-app-name
heroku config:set DATABASE_URL=your_db_url
heroku config:set PAGE_ACCESS_TOKEN=your_token
git push heroku main
```

## 🤝 Внесок у проект

1. Fork репозиторій
2. Створіть feature branch
3. Зробіть зміни
4. Створіть Pull Request

## 📄 Ліцензія

MIT License 