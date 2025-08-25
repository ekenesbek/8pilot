# Инструкция по установке и запуску N8N Copilot

## 🚀 Быстрый старт

### Шаг 1: Подготовка окружения

Убедитесь, что у вас установлены:
- Python 3.11 или выше
- Chrome/Chromium браузер
- Git

### Шаг 2: Клонирование проекта

```bash
git clone <URL-вашего-репозитория>
cd n8n-copilot
```

### Шаг 3: Запуск Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv venv

# Активация (macOS/Linux)
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Настройка конфигурации
cp env.example .env

# Редактируйте .env файл, добавив ваши API ключи
nano .env  # или любой текстовый редактор

# Запуск сервера
python run.py
```

### Шаг 4: Установка Chrome расширения

1. Откройте Chrome
2. Перейдите в `chrome://extensions/`
3. Включите "Режим разработчика" (Developer mode)
4. Нажмите "Загрузить распакованное расширение" (Load unpacked)
5. Выберите папку `n8n-copilot` (корневую папку проекта)

### Шаг 5: Настройка расширения

1. Откройте расширение
2. Перейдите в настройки
3. Укажите URL backend сервера: `http://localhost:8000`
4. Сохраните настройки

## 🔧 Детальная настройка

### Backend конфигурация (.env файл)

```bash
# Основные настройки
DEBUG=True
HOST=0.0.0.0
PORT=8000

# AI сервисы
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# База данных (опционально)
DATABASE_URL=postgresql://user:password@localhost/n8n_copilot

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# N8N интеграция
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
```

### Запуск через Docker (альтернатива)

```bash
cd backend

# Копирование конфигурации
cp env.example .env

# Редактирование .env файла
nano .env

# Запуск через Docker
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

## 🐛 Устранение проблем

### Проблема: Backend не запускается

**Решение:**
1. Проверьте версию Python: `python --version`
2. Убедитесь, что виртуальное окружение активировано
3. Проверьте установку зависимостей: `pip list`
4. Посмотрите логи ошибок в консоли

### Проблема: Расширение не загружается

**Решение:**
1. Проверьте режим разработчика в Chrome
2. Убедитесь, что все файлы на месте
3. Перезагрузите страницу расширений
4. Проверьте консоль на ошибки (F12 → Console)

### Проблема: AI не отвечает

**Решение:**
1. Проверьте API ключи в .env файле
2. Убедитесь, что backend запущен и доступен
3. Проверьте URL в настройках расширения
4. Посмотрите логи backend сервера

## 📱 Использование

### Открытие расширения

- **Sidepanel**: Нажмите на иконку расширения в панели инструментов
- **Popup**: Кликните на иконку в адресной строке
- **Settings**: Настройки доступны через popup

### Интеграция с n8n

1. Запустите n8n
2. В настройках расширения укажите URL n8n
3. Используйте AI ассистента для создания workflow

### AI чат

- Откройте чат в sidepanel
- Задавайте вопросы о n8n автоматизации
- Получайте готовые решения

## 🔍 Отладка

### Backend логи

```bash
# В консоли где запущен backend
# Или в файле logs/app.log
tail -f backend/logs/app.log
```

### Frontend отладка

1. Откройте Chrome DevTools (F12)
2. Перейдите в Console
3. Выберите расширение в dropdown
4. Просматривайте логи и ошибки

### Docker логи

```bash
docker-compose logs -f
```

## 📚 Дополнительные ресурсы

- [Документация FastAPI](https://fastapi.tiangolo.com/)
- [Chrome Extensions Developer Guide](https://developer.chrome.com/docs/extensions/)
- [N8N Documentation](https://docs.n8n.io/)

## 🆘 Получение помощи

Если у вас возникли проблемы:

1. Проверьте логи (см. раздел "Отладка")
2. Убедитесь, что все шаги выполнены правильно
3. Создайте issue в GitHub с описанием проблемы
4. Приложите логи ошибок и скриншоты

---

**Удачи с установкой! 🎉**
