# Popup Integration с In-Memory Storage

## Обзор архитектуры

Теперь API ключи устанавливаются через popup расширения и хранятся в памяти Chrome (chrome.storage.sync), что обеспечивает:

- ✅ **Единый источник истины** - popup управляет всеми API ключами
- ✅ **In-memory хранение** - данные хранятся в памяти браузера
- ✅ **Автоматическая синхронизация** - изменения в popup сразу отражаются в чате
- ✅ **Упрощенная архитектура** - убрано дублирование кода

## Как это работает

### 1. Popup (popup-final.js)
- Пользователь вводит API ключ и выбирает провайдера
- Данные сохраняются в `chrome.storage.sync`
- Отправляется сообщение всем content scripts о обновлении

### 2. ChatManager
- Загружает API ключи из `chrome.storage.sync`
- Слушает изменения в storage через `chrome.storage.onChanged`
- Автоматически обновляет credentials при изменении в popup

### 3. BackendApiService
- Получает API ключи как объект от ChatManager
- Передает их в backend в правильном формате

## Структура данных

### Popup Storage Format
```javascript
chrome.storage.sync = {
  openaiApiKey: 'sk-1234567890abcdef',
  provider: 'openai' // или 'anthropic'
}
```

### API Key Data Format
```javascript
// Для OpenAI
{
  openai_api_key: 'sk-1234567890abcdef'
}

// Для Anthropic
{
  anthropic_api_key: 'sk-ant-1234567890abcdef'
}
```

## Ключевые изменения

### 1. ChatManager.loadApiCredentials()
```javascript
async loadApiCredentials() {
  // Загружает напрямую из popup storage
  const result = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
  if (result.openaiApiKey) {
    this.setApiCredentials(result.openaiApiKey, result.provider || 'openai');
  }
}
```

### 2. ChatManager.checkApiCredentials()
```javascript
async checkApiCredentials() {
  // Проверяет popup storage и обновляет credentials
  const result = await chrome.storage.sync.get(['openaiApiKey', 'provider']);
  const hasCredentials = result.openaiApiKey && result.openaiApiKey.trim() !== '';
  
  if (hasCredentials && result.openaiApiKey !== this.apiKey) {
    this.setApiCredentials(result.openaiApiKey, result.provider || 'openai');
  }
  
  return hasCredentials;
}
```

### 3. ApiKeyManager упрощен
- Убрано дублирование с popup
- Все методы работают только с `chrome.storage.sync`
- Убрано локальное хранение

## Преимущества новой архитектуры

### ✅ Упрощение
- Один источник истины для API ключей
- Убрано дублирование кода
- Меньше сложности в управлении состоянием

### ✅ Надежность
- Автоматическая синхронизация между popup и чатом
- Нет рассинхронизации данных
- Простая отладка

### ✅ Производительность
- Меньше обращений к storage
- Быстрая загрузка credentials
- Эффективное обновление

## Тестирование

### 1. Установка API ключа
1. Откройте popup расширения
2. Введите OpenAI API ключ
3. Выберите провайдера
4. Нажмите Enter

### 2. Проверка в чате
1. Откройте n8n workflow
2. Активируйте расширение
3. Отправьте сообщение в чат
4. Должен работать без ошибок

### 3. Переключение провайдера
1. В popup выберите Anthropic
2. Введите Anthropic API ключ
3. В чате автоматически переключится на Anthropic

## Troubleshooting

### API ключ не загружается
- Проверьте, что popup сохранил ключ
- Проверьте консоль браузера на ошибки
- Убедитесь, что расширение активировано

### Чат не отвечает
- Проверьте, что backend запущен
- Проверьте правильность API ключа
- Проверьте, что провайдер выбран правильно

### Переключение не работает
- Обновите страницу после изменения в popup
- Проверьте, что storage изменился
- Проверьте консоль на ошибки

## Файлы изменены

- `frontend/components/chatManager.js` - обновлен для работы с popup storage
- `frontend/components/apiKeyManager.js` - упрощен для popup формата
- `popup-final.js` - уже настроен для работы с новой архитектурой

## Заключение

Новая архитектура обеспечивает простую и надежную интеграцию между popup и чатом, с автоматической синхронизацией API ключей и упрощенным управлением состоянием.
