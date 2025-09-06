# 8pilot Frontend-Backend Integration Architecture

## Обзор

Интеграция Chrome Extension (frontend) с Python FastAPI backend для работы с n8n workflow чатом без обязательной регистрации пользователей.

## Архитектура

### Frontend (Chrome Extension)

#### Основные компоненты:

1. **content.js** - Главный скрипт расширения
   - Загружает модули асинхронно
   - Управляет активацией/деактивацией
   - Детектирует n8n страницы
   - Извлекает workflow ID

2. **ChatManager** - Управление чатом
   - Интеграция с BackendApiService
   - Управление сессиями чата по workflow ID
   - Автоматическая загрузка истории чата
   - Проверка API ключей

3. **BackendApiService** - API клиент
   - Отправка сообщений в backend
   - Получение истории чата
   - Streaming поддержка
   - Обработка ошибок

4. **ApiKeyManager** - Управление API ключами
   - Сохранение в Chrome Storage
   - Модальное окно настройки
   - Поддержка OpenAI и Anthropic

5. **WorkflowExtractor** - Извлечение данных workflow
   - Детекция n8n страниц
   - Извлечение workflow ID из URL
   - Извлечение узлов и соединений

### Backend (Python FastAPI)

#### Основные компоненты:

1. **Chat Endpoints** (`/api/v1/chat/`)
   - `POST /send` - Отправка сообщения
   - `POST /stream` - Streaming ответы
   - `GET /sessions/{workflow_id}` - История чата
   - `GET /sessions/{workflow_id}/latest` - Последняя сессия

2. **ChatService** - Управление сессиями
   - In-memory хранение (без БД)
   - Создание сессий по workflow ID
   - Управление историей сообщений

3. **AIService** - Интеграция с AI провайдерами
   - Поддержка OpenAI и Anthropic
   - API ключи от frontend
   - Streaming ответы

4. **Models** - Модели данных
   - ChatRequest с API ключами
   - ChatSession с workflow привязкой
   - Message с ролями и контентом

## Поток данных

### 1. Инициализация
```
User opens n8n page → content.js detects → ChatManager loads → ApiKeyManager checks credentials
```

### 2. Отправка сообщения
```
User types message → ChatManager checks API key → BackendApiService sends to backend → 
Backend processes with AI → Response returned → ChatManager displays
```

### 3. Workflow Detection
```
Page navigation → WorkflowExtractor extracts ID → ChatManager updates context → 
Loads existing chat history for workflow
```

## Ключевые особенности

### Без регистрации
- API ключи передаются с каждым запросом
- Нет пользовательских аккаунтов
- In-memory хранение сессий

### Workflow-привязанные чаты
- Каждый workflow имеет свою историю чата
- Автоматическое переключение при навигации
- Сохранение контекста между сессиями

### Гибкая AI интеграция
- Поддержка OpenAI и Anthropic
- API ключи настраиваются пользователем
- Fallback на backend конфигурацию

## API Endpoints

### Chat API

#### POST /api/v1/chat/send
```json
{
  "message": "Create a workflow for social media automation",
  "workflow_id": "123",
  "session_id": "uuid",
  "provider": "openai",
  "openai_api_key": "sk-...",
  "context": {
    "workflow_context": "Workflow ID: 123"
  }
}
```

#### Response
```json
{
  "message": "Here's a workflow for social media automation...",
  "session_id": "uuid",
  "workflow_id": "123",
  "provider": "openai",
  "response_time": 1.23
}
```

#### GET /api/v1/chat/sessions/{workflow_id}
```json
{
  "workflow_id": "123",
  "sessions": [
    {
      "session_id": "uuid",
      "workflow_id": "123",
      "messages": [...],
      "created_at": "2024-01-01T00:00:00Z",
      "last_activity": "2024-01-01T00:00:00Z"
    }
  ],
  "total_messages": 10
}
```

## Конфигурация

### Frontend
- Backend URL: `http://localhost:8000/api/v1`
- API ключи хранятся в Chrome Storage
- Поддержка CORS для расширений

### Backend
- CORS настроен для Chrome расширений
- In-memory хранение сессий
- Поддержка API ключей от frontend

## Безопасность

- API ключи передаются только по HTTPS
- Нет постоянного хранения API ключей на backend
- CORS ограничения для расширений
- Валидация входных данных

## Развертывание

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
1. Загрузить расширение в Chrome
2. Настроить API ключи через модальное окно
3. Активировать на n8n страницах

## Мониторинг

- Логирование всех запросов
- Метрики использования AI провайдеров
- Отслеживание ошибок и fallback
- Health check endpoint

## Будущие улучшения

1. **Персистентное хранение**
   - SQLite/PostgreSQL для сессий
   - Redis для кэширования

2. **Аутентификация**
   - JWT токены
   - Пользовательские аккаунты

3. **Расширенная AI интеграция**
   - Больше провайдеров
   - Fine-tuned модели
   - Контекстная память

4. **Аналитика**
   - Использование по workflow
   - Популярные запросы
   - Производительность
