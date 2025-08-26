# 8pilot - AI Workflow Assistant

8pilot - это браузерное расширение для Chrome, которое интегрируется с n8n и предоставляет AI-ассистента для автоматизации рабочих процессов. Проект состоит из:

## 🎨 Brand Colors

8pilot использует современную цветовую схему на основе синих и голубых оттенков:

- **Primary Blue**: `#0ea5e9` - Основной брендовый цвет
- **Primary Cyan**: `#38bdf8` - Голубой акцент
- **Primary Sky**: `#7dd3fc` - Светло-голубой
- **Primary Teal**: `#14b8a6` - Бирюзовый
- **Primary Indigo**: `#6366f1` - Индиго

Градиенты создают современный и профессиональный вид:
- **Primary Gradient**: `linear-gradient(135deg, #0ea5e9, #38bdf8, #7dd3fc)`
- **Secondary Gradient**: `linear-gradient(135deg, #0ea5e9, #38bdf8)`
- **Accent Gradient**: `linear-gradient(135deg, #0ea5e9, #14b8a6)`

Все цвета определены в CSS переменных для легкого управления темой.

- **Frontend**: Chrome расширение (sidepanel, popup, settings)
- **Backend**: FastAPI сервер с AI интеграцией
- **Chatbot**: Веб-интерфейс для общения с AI

## 🌐 Landing Page

Официальный сайт: [https://8pilot.io](https://8pilot.io)

## 🚀 Возможности

- **AI Chat**: Интеграция с OpenAI и Anthropic для помощи в создании workflow
- **Workflow Management**: Управление n8n workflow через API
- **Template System**: Система шаблонов workflow
- **Real-time Streaming**: Потоковые ответы от AI
- **n8n Integration**: Прямая интеграция с n8n instances
- **Settings Management**: Управление настройками пользователя

## 🏗️ Архитектура

```
8pilot/
├── backend/                 # FastAPI сервер
│   ├── app/                # Основной код приложения
│   ├── requirements.txt    # Python зависимости
│   └── docker-compose.yml  # Docker конфигурация
├── sidepanel/              # Боковая панель расширения
│   ├── sidepanel.css      # Стили боковой панели
│   ├── sidepanel.html     # HTML структура
│   └── sidepanel.js       # JavaScript логика
├── settings/               # Страница настроек
│   ├── settings.css       # Стили настроек
│   ├── settings.html      # HTML структура
│   └── settings.js        # JavaScript логика
├── chatbot/                # Веб-интерфейс чата
│   ├── chatbot.css        # Стили чата
│   ├── chatbot.html       # HTML структура
│   └── chatbot.js         # JavaScript логика
├── styles.css              # Общие стили
├── common-colors.css       # Цветовая схема бренда
├── manifest.json           # Манифест расширения
└── extension.js            # Основной скрипт расширения
```

## 🛠️ Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <your-repo-url>
cd 8pilot
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
4. Выберите папку `8pilot` (корневую папку проекта)
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

## 🔧 Конфигурация

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
DATABASE_URL=postgresql://user:password@localhost/8pilot

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

## 📚 Использование

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

## 🎨 Стилизация и темы

### Цветовая схема

Проект использует единую цветовую схему, определенную в `common-colors.css`. Все компоненты импортируют эти переменные для обеспечения консистентности дизайна.

#### Основные цвета:
- **Primary**: `#0ea5e9` - Основной синий цвет бренда
- **Secondary**: `#38bdf8` - Дополнительный голубой
- **Accent**: `#14b8a6` - Бирюзовый акцент
- **Success**: `#10b981` - Зеленый для успешных операций
- **Error**: `#ef4444` - Красный для ошибок
- **Warning**: `#f59e0b` - Оранжевый для предупреждений

#### Градиенты:
- **Primary**: Трехцветный градиент от синего к голубому
- **Secondary**: Двухцветный градиент для кнопок
- **Accent**: Градиент от синего к бирюзовому

### CSS структура

- `common-colors.css` - Централизованные цветовые переменные
- `styles.css` - Общие стили для всего расширения
- `chatbot/chatbot.css` - Стили чат-интерфейса
- `settings/settings.css` - Стили страницы настроек
- `sidepanel/sidepanel.css` - Стили боковой панели

### Темная тема

Поддерживается автоматическое переключение на темную тему через `@media (prefers-color-scheme: dark)`. Все цвета адаптируются автоматически.

## 🧪 Разработка

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

## 🐛 Устранение неполадок

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

## 🚀 Развертывание

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

## 🤝 Поддержка

- **Website**: [https://8pilot.io](https://8pilot.io)
- **Issues**: Создавайте issues в GitHub
- **Discussions**: Используйте GitHub Discussions для вопросов
- **Wiki**: Дополнительная документация в Wiki репозитория

## 📄 Лицензия

[Укажите вашу лицензию]

---

**Примечание**: Это базовая инструкция. Для детальной настройки конкретных компонентов обратитесь к соответствующим README файлам в подпапках.
