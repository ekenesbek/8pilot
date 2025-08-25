# N8N Copilot - Инструкция по запуску

## Описание проекта

N8N Copilot - это браузерное расширение для Chrome, которое интегрируется с n8n и предоставляет AI-ассистента для автоматизации рабочих процессов. Проект состоит из:

- **Frontend**: Chrome расширение (sidepanel, popup, settings)
- **Backend**: FastAPI сервер с AI интеграцией
- **Chatbot**: Веб-интерфейс для общения с AI

## Требования

- Python 3.11+
- Node.js 18+ (опционально, для сборки расширения)
- Chrome/Chromium браузер
- Docker и Docker Compose (для запуска через контейнеры)

## Быстрый запуск

### 1. Клонирование репозитория

```bash
git clone <your-repo-url>
cd n8n-copilot
```

### 2. Настройка Backend

#### Вариант A: Локальный запуск

```bash
cd backend

# Создание виртуального окружения
python -m venv venv

# Активация виртуального окружения
# На macOS/Linux:
source venv/bin/activate
# На Windows:
# venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Копирование конфигурации
cp env.example .env

# Редактирование .env файла
# Добавьте необходимые API ключи и настройки

# Запуск сервера
python run.py
```

#### Вариант B: Запуск через Docker

```bash
cd backend

# Копирование конфигурации
cp env.example .env

# Редактирование .env файла
# Добавьте необходимые API ключи и настройки

# Запуск через Docker Compose
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

### 3. Установка Chrome расширения

#### Вариант A: Загрузка в режиме разработчика

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика" (Developer mode)
3. Нажмите "Загрузить распакованное расширение" (Load unpacked)
4. Выберите папку `n8n-copilot` (корневую папку проекта)
5. Расширение будет установлено и появится в списке

#### Вариант B: Сборка и установка

```bash
# В корневой папке проекта
npm install
npm run build
# Затем следуйте инструкциям Варианта A
```

### 4. Настройка расширения

1. Откройте расширение в браузере
2. Перейдите в настройки (Settings)
3. Укажите URL вашего backend сервера (по умолчанию: `http://localhost:8000`)
4. Сохраните настройки

## Конфигурация

### Backend (.env файл)

```bash
# Основные настройки
DEBUG=True
HOST=0.0.0.0
PORT=8000

# AI сервис (OpenAI, Anthropic, etc.)
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# База данных
DATABASE_URL=postgresql://user:password@localhost/n8n_copilot

# Redis (для кэширования)
REDIS_URL=redis://localhost:6379

# N8N интеграция
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
```

### Frontend (manifest.json)

Основные настройки расширения находятся в `manifest.json`. При необходимости измените:

- `name`: Название расширения
- `version`: Версия
- `permissions`: Разрешения для доступа к сайтам
- `host_permissions`: Разрешения для доступа к хостам

## Использование

### 1. Открытие расширения

- **Sidepanel**: Нажмите на иконку расширения в панели инструментов
- **Popup**: Кликните на иконку расширения в адресной строке
- **Settings**: Настройки доступны через popup или sidepanel

### 2. Интеграция с n8n

1. Убедитесь, что n8n запущен и доступен
2. В настройках расширения укажите URL n8n
3. Используйте AI ассистента для создания и оптимизации рабочих процессов

### 3. AI чат

- Откройте чат в sidepanel
- Задавайте вопросы о n8n автоматизации
- Получайте готовые решения и примеры кода

## Разработка

### Структура проекта

```
n8n-copilot/
├── backend/                 # FastAPI сервер
│   ├── app/                # Основной код приложения
│   ├── requirements.txt    # Python зависимости
│   └── docker-compose.yml  # Docker конфигурация
├── sidepanel/              # Боковая панель расширения
├── settings/               # Страница настроек
├── chatbot/                # Веб-интерфейс чата
├── manifest.json           # Манифест расширения
└── extension.js            # Основной скрипт расширения
```

### Команды для разработки

```bash
# Backend
cd backend
source venv/bin/activate
python run.py

# Frontend (если используется сборка)
npm run dev
npm run build

# Тестирование
cd backend
pytest

# Линтинг
cd backend
flake8 app/
black app/
```

### Отладка

1. **Backend**: Логи доступны в консоли или в файле `logs/app.log`
2. **Frontend**: Используйте Chrome DevTools для отладки расширения
3. **Docker**: `docker-compose logs -f` для просмотра логов контейнеров

## Устранение неполадок

### Частые проблемы

1. **Расширение не загружается**
   - Проверьте режим разработчика
   - Убедитесь, что все файлы на месте
   - Проверьте консоль на ошибки

2. **Backend не отвечает**
   - Проверьте, что сервер запущен
   - Убедитесь в правильности URL в настройках
   - Проверьте логи сервера

3. **AI не работает**
   - Проверьте API ключи в .env файле
   - Убедитесь в доступности AI сервиса
   - Проверьте логи для деталей ошибок

### Логи и отладка

```bash
# Backend логи
tail -f backend/logs/app.log

# Docker логи
docker-compose logs -f

# Chrome DevTools
# F12 → Console → Выберите расширение в dropdown
```

## Развертывание

### Продакшн

1. Измените `DEBUG=False` в .env
2. Настройте HTTPS для backend
3. Используйте production базу данных
4. Настройте мониторинг и логирование

### Docker Production

```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

## Поддержка

- **Issues**: Создавайте issues в GitHub
- **Discussions**: Используйте GitHub Discussions для вопросов
- **Wiki**: Дополнительная документация в Wiki репозитория

## Лицензия

[Укажите вашу лицензию]

---

**Примечание**: Это базовая инструкция. Для детальной настройки конкретных компонентов обратитесь к соответствующим README файлам в подпапках.
