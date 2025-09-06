# Docker Setup для 8pilot Backend

## Быстрый запуск через Docker

### 1. Запуск через Docker Compose (рекомендуется)

```bash
cd backend
docker-compose -f docker-compose.simple.yml up --build
```

### 2. Запуск через Docker напрямую

```bash
cd backend
docker build -t 8pilot-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=your-key-here 8pilot-backend
```

### 3. Запуск с переменными окружения

Создайте файл `.env` в папке `backend/`:

```env
DEBUG=true
HOST=0.0.0.0
PORT=8000
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

Затем запустите:

```bash
cd backend
docker-compose -f docker-compose.simple.yml up --build
```

## Проверка работы

После запуска backend будет доступен по адресу: `http://localhost:8000`

### Health Check
```bash
curl http://localhost:8000/health
```

### Тест CORS
```bash
python test_cors.py
```

## Особенности Docker конфигурации

- ✅ **In-memory режим** - не требует PostgreSQL
- ✅ **CORS настроен** для работы с n8n серверами
- ✅ **Health check** встроен
- ✅ **Автоматический restart** при сбоях
- ✅ **Логи** сохраняются в папку `logs/`

## Troubleshooting

### Порт 8000 занят
```bash
# Остановить все процессы на порту 8000
lsof -ti:8000 | xargs kill -9

# Или использовать другой порт
docker run -p 8001:8000 8pilot-backend
```

### CORS ошибки
Backend настроен для работы с любыми origin'ами. Если проблемы остаются:

1. Проверьте, что backend запущен: `curl http://localhost:8000/health`
2. Проверьте CORS: `python test_cors.py`
3. Убедитесь, что frontend обращается к правильному URL

### Логи
```bash
# Просмотр логов
docker-compose -f docker-compose.simple.yml logs -f

# Или для отдельного контейнера
docker logs <container_id>
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DEBUG` | Режим отладки | `true` |
| `HOST` | Хост для привязки | `0.0.0.0` |
| `PORT` | Порт для привязки | `8000` |
| `OPENAI_API_KEY` | OpenAI API ключ | - |
| `ANTHROPIC_API_KEY` | Anthropic API ключ | - |

## API Endpoints

- `GET /health` - Проверка здоровья
- `POST /api/v1/chat/send` - Отправка сообщения
- `POST /api/v1/chat/stream` - Streaming ответ
- `GET /api/v1/chat/sessions/{workflow_id}` - История чата
