# 8pilot Backend

Python/FastAPI backend для расширения 8pilot, предоставляющий AI-функциональность и интеграцию с n8n.

## 🚀 Возможности

- **AI Chat**: Интеграция с OpenAI и Anthropic для помощи в создании workflow
- **Workflow Management**: Управление n8n workflow через API
- **Template System**: Система шаблонов workflow
- **Real-time Streaming**: Потоковые ответы от AI
- **n8n Integration**: Прямая интеграция с n8n instances
- **Settings Management**: Управление настройками пользователя

## 🏗️ Архитектура

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   └── v1/
│   │       ├── endpoints/   # Конкретные endpoints
│   │       └── api.py       # Главный роутер
│   ├── core/                # Основные настройки
│   │   ├── config.py        # Конфигурация
│   │   └── logging.py       # Логирование
│   ├── models/              # Pydantic модели
│   │   ├── chat.py          # Модели чата
│   │   ├── workflow.py      # Модели workflow
│   │   └── settings.py      # Модели настроек
│   ├── services/            # Бизнес-логика
│   │   ├── ai_service.py    # AI интеграция
│   │   ├── chat_service.py  # Управление чатом
│   │   ├── workflow_service.py # Управление workflow
│   │   ├── n8n_service.py   # n8n интеграция
│   │   └── settings_service.py # Управление настройками
│   └── main.py              # Точка входа
├── requirements.txt          # Python зависимости
├── Dockerfile               # Docker контейнер
├── docker-compose.yml       # Docker Compose
└── README.md                # Документация
```

## 🛠️ Установка и запуск

### Локальная разработка

1. **Клонируйте репозиторий**
   ```bash
   cd backend
   ```

2. **Создайте виртуальное окружение**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # или
   venv\Scripts\activate     # Windows
   ```

3. **Установите зависимости**
   ```bash
   pip install -r requirements.txt
   ```

4. **Создайте .env файл**
   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашими настройками
   ```

5. **Запустите приложение**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker

1. **Создайте .env файл**
   ```bash
   cp .env.example .env
   # Отредактируйте .env
   ```

2. **Запустите с Docker Compose**
   ```bash
   # Сборка без кэша (рекомендуется)
   docker-compose build --no-cache
   
   # Запуск в фоновом режиме
   docker-compose up -d
   ```

3. **Проверьте статус и логи**
   ```bash
   # Статус контейнеров
   docker-compose ps
   
   # Просмотр логов backend
   docker-compose logs -f backend
   
   # Просмотр всех логов
   docker-compose logs -f
   ```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DEBUG` | Режим отладки | `false` |
| `PORT` | Порт приложения | `8000` |
| `HOST` | Хост приложения | `0.0.0.0` |
| `OPENAI_API_KEY` | OpenAI API ключ | - |
| `ANTHROPIC_API_KEY` | Anthropic API ключ | - |
| `N8N_DEFAULT_URL` | URL n8n instance | - |
| `N8N_DEFAULT_API_KEY` | n8n API ключ | - |

### AI Providers

Поддерживаются два AI провайдера:
- **OpenAI**: GPT-4o, GPT-3.5-turbo
- **Anthropic**: Claude-3-Sonnet

## 📚 API Endpoints

### Chat API
- `POST /api/v1/chat/send` - Отправить сообщение
- `POST /api/v1/chat/stream` - Потоковый ответ
- `GET /api/v1/chat/sessions/{workflow_id}` - История чата

### Workflow API
- `GET /api/v1/workflow/{workflow_id}` - Получить workflow
- `PUT /api/v1/workflow/{workflow_id}` - Обновить workflow
- `POST /api/v1/workflow/{workflow_id}/apply` - Применить к n8n
- `POST /api/v1/workflow/{workflow_id}/execute` - Выполнить workflow

### Settings API
- `GET /api/v1/settings/` - Получить настройки
- `PUT /api/v1/settings/` - Обновить настройки
- `GET /api/v1/settings/n8n-instances` - n8n instances
- `POST /api/v1/settings/n8n-instances` - Создать n8n instance

### Auth API
- `POST /api/v1/auth/login` - Вход в систему
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/logout` - Выход из системы
- `GET /api/v1/auth/me` - Информация о текущем пользователе

## 🔌 Интеграция с n8n

Бэкенд интегрируется с n8n через REST API:

- **Workflow Management**: Создание, чтение, обновление workflow
- **Execution**: Запуск workflow и получение результатов
- **Monitoring**: Статистика выполнения и статус workflow

## 🧪 Тестирование

```bash
# Запуск тестов
pytest

# С покрытием
pytest --cov=app

# С отчетом
pytest --cov=app --cov-report=html
```

## 📊 Мониторинг

- **Health Check**: `GET /health`
- **API Docs**: `GET /docs` (Swagger UI)
- **ReDoc**: `GET /redoc`

## 🚀 Развертывание

### Production

1. **Настройте переменные окружения**
2. **Используйте production WSGI сервер**
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Docker Production

```bash
docker build -t 8pilot-backend .
docker run -d -p 8000:8000 --env-file .env 8pilot-backend
```

## 🤝 Разработка

### Структура кода

- **Async/Await**: Все операции асинхронные
- **Type Hints**: Полная типизация с Python typing
- **Pydantic**: Валидация данных и сериализация
- **Dependency Injection**: Чистая архитектура

### Добавление новых endpoints

1. Создайте модель в `app/models/`
2. Создайте сервис в `app/services/`
3. Создайте endpoint в `app/api/v1/endpoints/`
4. Добавьте в главный роутер `app/api/v1/api.py`

## 📝 Логирование

Логи сохраняются в:
- Консоль (stdout)
- Файл `logs/app.log` с ротацией

## 🔒 Безопасность

- CORS настройки для extension
- Валидация входных данных
- Rate limiting
- Trusted Host middleware

## 📈 Производительность

- Асинхронная обработка запросов
- Кэширование с Redis
- Оптимизированные database queries
- Streaming responses для AI

## 🐛 Troubleshooting

### Частые проблемы

1. **ModuleNotFoundError: No module named 'app.models.sidepanel'**
   ```bash
   # Проблема исправлена в последней версии
   # Удалены ссылки на несуществующий sidepanel модуль
   ```

2. **Port already in use**
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

3. **Docker build issues**
   ```bash
   # Очистите кэш и пересоберите
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Backend не запускается**
   ```bash
   # Проверьте логи
   docker-compose logs -f backend
   
   # Проверьте .env файл
   cat .env
   ```

5. **API key errors**
   - Проверьте .env файл
   - Убедитесь в правильности API ключей
   - Убедитесь что .env файл находится в правильной директории

## 📞 Поддержка

- **Issues**: GitHub Issues
- **Documentation**: API docs на `/docs`
- **Logs**: `logs/app.log`

## 📄 Лицензия

MIT License
