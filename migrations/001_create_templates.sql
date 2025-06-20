-- Створення таблиці шаблонів
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Додавання базових шаблонів
INSERT INTO message_templates (name, content, category) VALUES
('Вітання', 'Вітаємо! Дякуємо за ваше звернення до Director.ua. Чим можемо допомогти?', 'Загальне'),
('Відсутність відповіді', 'Перепрошуємо за затримку. Ми отримали ваше повідомлення та скоро відповімо.', 'Автовідповідь'),
('Завершення розмови', 'Дякуємо за звернення! Якщо у вас виникнуть додаткові питання, ми завжди раді допомогти.', 'Загальне'); 