# 8pilot Quick Start Guide

## Быстрый старт интеграции Frontend + Backend

### 1. Запуск Backend

#### Вариант A: Через Docker (рекомендуется)

```bash
# Перейти в папку backend
cd backend

# Запустить через Docker Compose
docker-compose -f docker-compose.simple.yml up --build
```

#### Вариант B: Напрямую через Python

```bash
# Перейти в папку backend
cd backend

# Установить зависимости
pip install -r requirements.txt

# Запустить сервер
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend будет доступен по адресу: `http://localhost:8000`

### 2. Настройка Frontend (Chrome Extension)

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `frontend/` из проекта

### 3. Настройка API ключей

1. Нажмите на иконку расширения 8pilot в панели инструментов браузера
2. Перейдите на вкладку "API" в popup
3. Выберите провайдера (OpenAI или Anthropic)
4. Введите ваш API ключ:
   - OpenAI: ключ начинается с `sk-`
   - Anthropic: ключ начинается с `sk-ant-`
5. Ключ сохранится автоматически

### 4. Тестирование

Запустите тестовый скрипт:

```bash
python test_integration.py
```

### 5. Использование

1. Откройте n8n workflow
2. Активируйте расширение
3. Нажмите на иконку чата
4. Введите вопрос о workflow
5. Получите AI ответ с привязкой к текущему workflow

## Архитектура

```
Chrome Extension (Frontend)
├── content.js - Главный скрипт
├── ChatManager - Управление чатом
├── BackendApiService - API клиент
├── ApiKeyManager - Управление ключами
└── WorkflowExtractor - Извлечение данных

Python Backend (FastAPI)
├── /api/v1/chat/send - Отправка сообщений
├── /api/v1/chat/sessions/{id} - История чата
├── ChatService - Управление сессиями
└── AIService - AI интеграция
```

## Особенности

- ✅ Без регистрации - только API ключи
- ✅ Workflow-привязанные чаты
- ✅ Автоматическое переключение между workflow
- ✅ In-memory хранение сессий
- ✅ Поддержка OpenAI и Anthropic
- ✅ Streaming ответы

## Troubleshooting

### Backend не запускается
- Проверьте, что порт 8000 свободен
- Убедитесь, что установлены все зависимости

### Frontend не работает
- Проверьте, что backend запущен
- Убедитесь, что CORS настроен правильно
- Проверьте консоль браузера на ошибки

### API ключи не сохраняются
- Проверьте права расширения на доступ к storage
- Убедитесь, что ключ валидный

## API Endpoints

- `GET /health` - Проверка здоровья
- `POST /api/v1/chat/send` - Отправка сообщения
- `POST /api/v1/chat/stream` - Streaming ответ
- `GET /api/v1/chat/sessions/{workflow_id}` - История чата
- `GET /api/v1/chat/sessions/{workflow_id}/latest` - Последняя сессия

## Конфигурация

### Backend (.env)
```env
DEBUG=true
HOST=0.0.0.0
PORT=8000
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
```

### Frontend
- Backend URL: `http://localhost:8000/api/v1`
- API ключи хранятся в Chrome Storage
