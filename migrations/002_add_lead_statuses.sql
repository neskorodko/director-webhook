-- Додавання нових статусів для лідів
-- Оновлюємо існуючі записи з базовими статусами
UPDATE leads SET status = 'NEW' WHERE status IS NULL OR status = '';

-- Додаємо CHECK constraint для валідації статусів
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    'NEW',           -- Новий лід
    'CONTACTED',     -- Встановлено контакт
    'QUALIFIED',     -- Кваліфікований лід
    'PROPOSAL',      -- Надіслано пропозицію
    'NEGOTIATION',   -- Переговори
    'CLOSED_WON',    -- Успішно закрито
    'CLOSED_LOST',   -- Втрачено
    'ON_HOLD',       -- На паузі
    'FOLLOW_UP'      -- Потребує повторного контакту
));

-- Додаємо поле для збереження ID власного аккаунту (щоб не зберігати його як ліда)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_own_account BOOLEAN DEFAULT FALSE;

-- Додаємо індекс для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_is_own_account ON leads(is_own_account); 