# Руководство по миграции: JavaScript → Python/FastAPI

Это руководство описывает процесс миграции n8n-copilot с JavaScript архитектуры на Python/FastAPI backend.

## 🎯 Цели миграции

- **Улучшение производительности**: Асинхронная обработка запросов
- **Лучшая масштабируемость**: Модульная архитектура
- **Современные технологии**: FastAPI, Pydantic, async/await
- **Упрощение разработки**: Четкое разделение ответственности
- **Лучшая интеграция**: Стандартные Python инструменты

## 🏗️ Архитектурные изменения

### До миграции (JavaScript)
```
sidepanel/
├── sidepanel.js      # Вся логика в одном файле
├── sidepanel.html    # UI
└── sidepanel.css     # Стили
```

### После миграции (Python/FastAPI)
```
backend/
├── app/
│   ├── api/          # API endpoints
│   ├── core/         # Конфигурация
│   ├── models/       # Pydantic модели
│   ├── services/     # Бизнес-логика
│   └── main.py       # Точка входа
├── requirements.txt   # Python зависимости
└── Dockerfile        # Контейнеризация
```

## 📋 Пошаговая миграция

### Шаг 1: Создание Python структуры

```bash
mkdir -p backend/app/{api/v1/endpoints,core,models,services}
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic httpx
```

### Шаг 2: Миграция моделей данных

**JavaScript (до):**
```javascript
// Встроенные объекты в JS
let settings = {
  openaiKey: '',
  anthropicKey: '',
  activeProvider: 'openai'
};
```

**Python (после):**
```python
# app/models/settings.py
from pydantic import BaseModel
from typing import Literal

class UserSettings(BaseModel):
    openai_api_key: str
    anthropic_api_key: str
    active_provider: Literal["openai", "anthropic"] = "openai"
```

### Шаг 3: Миграция бизнес-логики

**JavaScript (до):**
```javascript
// Встроенные функции в sidepanel.js
async function callOpenAI(message, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: message }]
    })
  });
  return response.json();
}
```

**Python (после):**
```python
# app/services/ai_service.py
import httpx
from app.models.chat import Message

class AIService:
    async def call_openai(self, message: str, api_key: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": message}]
                }
            )
            return response.json()
```

### Шаг 4: Миграция API endpoints

**JavaScript (до):**
```javascript
// Нет API endpoints - вся логика в extension
```

**Python (после):**
```python
# app/api/v1/endpoints/chat.py
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/send", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    try:
        # Логика обработки сообщения
        return ChatResponse(message="AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Шаг 5: Миграция конфигурации

**JavaScript (до):**
```javascript
// Хардкод в коде
const API_URL = 'https://api.openai.com/v1';
```

**Python (после):**
```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    anthropic_api_key: str
    debug: bool = False
    
    class Config:
        env_file = ".env"
```

## 🔄 Изменения в frontend

### Обновление API вызовов

**JavaScript (до):**
```javascript
// Прямые вызовы к AI API
const response = await callOpenAI(message, apiKey);
```

**JavaScript (после):**
```javascript
// Вызовы к нашему backend
const response = await fetch('/api/v1/chat/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, workflow_id })
});
```

### Обновление настроек

**JavaScript (до):**
```javascript
// Локальное хранение в extension
chrome.storage.sync.set(settings);
```

**JavaScript (после):**
```javascript
// Синхронизация с backend
await fetch('/api/v1/settings/', {
  method: 'PUT',
  body: JSON.stringify(settings)
});
```

## 🚀 Запуск мигрированного приложения

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend
- Обновите extension для работы с новым backend
- Настройте CORS в backend для extension
- Обновите API endpoints в extension

## 📊 Преимущества миграции

### Производительность
- **Асинхронность**: Неблокирующие операции
- **Кэширование**: Redis для быстрых ответов
- **Оптимизация**: Эффективные database queries

### Разработка
- **Типизация**: Pydantic валидация
- **Документация**: Автоматическая генерация API docs
- **Тестирование**: Простое unit и integration тестирование

### Масштабируемость
- **Микросервисы**: Легкое разделение на компоненты
- **Docker**: Простое развертывание
- **Load Balancing**: Возможность горизонтального масштабирования

## 🧪 Тестирование миграции

### Backend тесты
```bash
cd backend
pytest
pytest --cov=app
```

### API тесты
```bash
# Health check
curl http://localhost:8000/health

# API docs
curl http://localhost:8000/docs

# Chat endpoint
curl -X POST http://localhost:8000/api/v1/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "workflow_id": "test"}'
```

## 🔧 Конфигурация после миграции

### Environment variables
```bash
# .env
DEBUG=true
PORT=8000
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
N8N_DEFAULT_URL=https://your-n8n.com
N8N_DEFAULT_API_KEY=your-n8n-key
```

### Docker
```bash
docker-compose up -d
```

## 📝 Чек-лист миграции

- [ ] Создана Python структура проекта
- [ ] Мигрированы модели данных (Pydantic)
- [ ] Мигрирована бизнес-логика (services)
- [ ] Созданы API endpoints
- [ ] Настроена конфигурация
- [ ] Обновлен frontend для работы с backend
- [ ] Протестирована функциональность
- [ ] Настроено логирование
- [ ] Настроена безопасность (CORS, validation)
- [ ] Создана документация

## 🐛 Решение проблем

### Импорт ошибки
```bash
# Убедитесь в правильности PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/backend"
```

### CORS ошибки
```python
# В app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API key ошибки
```bash
# Проверьте .env файл
cat .env | grep API_KEY
```

## 📚 Дополнительные ресурсы

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Python Async/Await](https://docs.python.org/3/library/asyncio.html)

## 🎉 Завершение миграции

После успешной миграции у вас будет:

1. **Современный backend** на Python/FastAPI
2. **Модульная архитектура** с четким разделением ответственности
3. **Автоматическая документация** API
4. **Лучшая производительность** и масштабируемость
5. **Простота разработки** и тестирования
6. **Готовность к production** развертыванию

Миграция завершена! 🚀
