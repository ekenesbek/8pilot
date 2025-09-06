# 8pilot Final Setup Guide

## 🚀 Быстрый старт

### 1. Запуск Backend
```bash
# Вариант A: Через Docker (рекомендуется)
cd backend
docker-compose -f docker-compose.simple.yml up --build

# Вариант B: Через Python
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Вариант C: Через скрипт
./start_backend.sh
```

### 2. Настройка Frontend
1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `8pilot` (корневая папка проекта)

### 3. Настройка API ключа
1. Нажмите на иконку 8pilot в панели инструментов
2. Перейдите на вкладку "API"
3. Выберите провайдера (OpenAI или Anthropic)
4. Введите ваш API ключ
5. Нажмите Enter для сохранения

### 4. Использование
1. Откройте n8n workflow
2. Нажмите на иконку 8pilot для активации
3. Введите сообщение в чат
4. Получите ответ от AI

## 🔧 Архитектура

### Frontend (Chrome Extension)
- **popup-final.js** - управление API ключами
- **content.js** - основной скрипт, загрузка модулей
- **chatManager.js** - управление чатом и API ключами
- **backendApiService.js** - связь с Python backend

### Backend (Python FastAPI)
- **main.py** - FastAPI приложение с CORS
- **chat.py** - API endpoints для чата
- **ai_service.py** - интеграция с OpenAI/Anthropic
- **chat_service.py** - in-memory управление сессиями

### Хранение данных
- **API ключи** - `chrome.storage.sync` (popup управляет)
- **Чат история** - in-memory на backend
- **Настройки** - `chrome.storage.sync`

## 📋 Особенности

### ✅ In-Memory Storage
- Чат история хранится в памяти backend
- Нет необходимости в базе данных
- Быстрая работа, простая настройка

### ✅ Popup Integration
- API ключи управляются через popup
- Автоматическая синхронизация с чатом
- Поддержка OpenAI и Anthropic

### ✅ Workflow Detection
- Автоматическое определение workflow ID
- История чата привязана к workflow
- Переключение между workflow'ами

### ✅ CORS Support
- Настроен для работы с n8n серверами
- Поддержка всех origin'ов для разработки
- Правильная обработка preflight запросов

## 🐛 Troubleshooting

### Backend не запускается
```bash
# Проверьте порт 8000
lsof -i:8000

# Остановите процессы
lsof -ti:8000 | xargs kill -9

# Запустите заново
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### CORS ошибки
- Backend настроен для всех origin'ов
- Проверьте, что backend запущен
- Проверьте консоль браузера

### API ключ не работает
- Проверьте формат ключа (sk- для OpenAI, sk-ant- для Anthropic)
- Убедитесь, что у вас есть активная подписка
- Проверьте, что ключ сохранен в popup

### Чат не отвечает
- Проверьте, что расширение активировано
- Проверьте, что backend запущен
- Проверьте консоль браузера на ошибки

## 📁 Структура проекта

```
8pilot/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI приложение
│   │   ├── api/v1/endpoints/chat.py
│   │   ├── services/ai_service.py
│   │   └── models/chat.py
│   ├── docker-compose.simple.yml
│   └── start_backend.sh
├── frontend/               # Chrome Extension
│   ├── components/
│   │   ├── chatManager.js
│   │   ├── apiKeyManager.js
│   │   └── chatMessages.js
│   ├── services/backendAPIService.js
│   └── content.js
├── popup-final.js          # Extension popup
├── manifest.json
└── README.md
```

## 🎯 Следующие шаги

1. **Тестирование** - протестируйте с реальными API ключами
2. **Документация** - добавьте больше примеров использования
3. **UI улучшения** - улучшите интерфейс чата
4. **Функции** - добавьте новые возможности (файлы, история)

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12)
2. Проверьте логи backend
3. Создайте issue в репозитории
4. Обратитесь к документации

---

**Готово!** Теперь у вас есть полностью функциональная интеграция frontend + backend с in-memory хранением и popup управлением API ключами.
