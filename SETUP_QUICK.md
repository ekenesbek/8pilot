# 🚀 Быстрая настройка 8pilot

## ❗ Критично: Настройка API ключей

### 1. Получите API ключи:

**OpenAI:**
- Перейдите на https://platform.openai.com/api-keys
- Создайте новый API ключ
- Скопируйте ключ (начинается с `sk-`)

**Anthropic (опционально):**
- Перейдите на https://console.anthropic.com/
- Создайте новый API ключ
- Скопируйте ключ (начинается с `sk-ant-`)

### 2. Настройте бэкенд:

Отредактируйте файл `backend/.env`:

```bash
cd backend
nano .env
```

Замените строки:
```env
# БЫЛО:
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# ДОЛЖНО БЫТЬ (ваши реальные ключи):
OPENAI_API_KEY=sk-proj-ваш_реальный_openai_ключ_здесь
ANTHROPIC_API_KEY=sk-ant-ваш_реальный_anthropic_ключ_здесь
```

### 3. Перезапустите бэкенд:

```bash
# Остановите текущий сервер (Ctrl+C)
# Затем запустите снова:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Проверьте:

Если настройка корректна, вы увидите в логах:
```
OpenAI API key configured: Yes
Anthropic API key configured: Yes
```

## 🔧 Что было изменено:

- ✅ API ключи теперь хранятся только на сервере
- ✅ Убраны поля ввода API ключей из UI
- ✅ Упрощена настройка для пользователей
- ✅ Повышена безопасность

## ⚠️ Важно:

- **Никогда не коммитьте файл `.env` в git!**
- Ключи теперь настраиваются один раз на сервере
- Пользователи больше не видят и не управляют API ключами
