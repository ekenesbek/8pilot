### **Why Use Folders and Separate Files?**

- **Separation of Concerns:** Each feature (chatbot, settings) has its own HTML, JS, and CSS, making it easier to develop and debug.
- **Scalability:** As the extension grows (e.g., adding more features or providers), new files can be added to the relevant folder without cluttering the root directory.
- **Maintainability:** Developers can quickly find and update code related to a specific feature.
- **Chrome Extension Best Practices:** This structure aligns with how professional Chrome extensions are organized, making it easier for new contributors to understand the codebase.

---

## Extension Components

### 1. Manifest and Structure

- `manifest.json`: Configuration file defining permissions, scripts, and resources.
- `extension.js`: Service worker for handling background events and message passing.
- `page.js`: Script injected into web pages to detect n8n workflow pages and add the chat interface.
- `chatbot/`: All files for the chat overlay UI and logic.
- `settings/`: All files for the popup/settings panel UI and logic.
- `icons/`: All icon files for the extension and UI elements.

### 2. Browser Action Popup (Settings)

- Provided by `settings/settings.html`, styled by `settings/settings.css`, and powered by `settings/settings.js`.
- Allows users to configure API keys, select AI provider, and see extension status.
- Centralized n8n page detection logic for consistent behavior.

### 3. Chat Interface

- A floating chat icon appears on all pages, with full functionality on n8n pages.
- UI defined in `chatbot/chatbot.html` and styled by `chatbot/chatbot.css`.
- Currently supports static assistant responses; AI integration is the next step.
- Uses custom events for secure cross-script communication.

### 4. AI Integration (Coming Soon)

- Will use OpenAI's GPT-4 model for generating workflow suggestions.
- Will maintain conversation history for context.
- Will validate and extract JSON for workflow application.

### 5. n8n Integration

- Automatic detection of n8n workflow pages via settings.js.
- Direct injection of workflow components onto the canvas (planned).
- Support for various node types and configurations.

---

## Technical Implementation

### Architecture Changes

- Renamed `background.js` to `extension.js` for clarity.
- Renamed `content.js` to `page.js` to better reflect its purpose.
- Centralized n8n page detection in settings.js.
- Implemented cross-script communication using custom events.
- Added persistent chat icon across all pages.

### Authentication & API Keys

- Securely stores OpenAI API keys in Chrome's storage (via settings panel).
- Supports switching between different AI providers (future).
- Validates API keys before making requests (future).

### Session Management

- Creates and maintains session IDs for tracking conversations (future).
- Preserves chat history within browser sessions (future).
- Supports multiple chat sessions across different tabs (future).

### Message Processing

1. User inputs a natural language request.
2. Request is sent to OpenAI with appropriate context (future).
3. Response is parsed for any JSON workflow definitions (future).
4. JSON is validated against n8n's expected format (future).
5. Valid workflow components can be applied to the canvas (future).

### DOM Interaction

- The extension interacts with n8n's web interface through DOM manipulation.
- Detects n8n workflow pages by examining URL patterns.
- Injects a persistent chat icon on all pages that adapts to the page context.
- Shows full chat functionality on n8n pages, limited functionality elsewhere.

---

## User Experience Flow

1. User installs the n8n Co Pilot extension.
2. User sees the chat icon on all pages, with full functionality on n8n pages.
3. Extension automatically detects n8n pages and shows status in the popup.
4. User enters their OpenAI API key in the settings (future).
5. User clicks the chat icon to open the chat overlay.
6. User describes their workflow requirements in natural language.
7. AI generates suggestions and workflow components (future).
8. User can apply these components directly to their workflow (future).
9. Iterative conversation continues to refine the workflow (future).

---

## Development Roadmap

### Current Implementation
- Modular folder structure for chatbot and settings.
- Renamed files for better clarity and understanding.
- Centralized n8n page detection.
- Persistent chat icon across all pages.
- Popup/settings panel for configuration.

### Next Steps
- Fix current issues with chat display.
- Implement proper resource loading for injected scripts.
- Integrate OpenAI API for real AI chat.
- Add session memory and chat history.
- Enable JSON validation and workflow injection.
- Enhance n8n canvas interaction.
- Add support for multiple AI providers.

---

## End Goal

The ultimate goal of n8n Co Pilot is to democratize workflow automation by bridging the gap between natural language and technical implementation. Users should be able to describe what they want to accomplish, and the AI assistant will help translate those requirements into functional n8n workflows.

---

## Technical Requirements

- Chrome browser (version 88+)
- OpenAI API key (future)
- n8n instance (cloud or self-hosted)

---

## Privacy Considerations

- API keys are stored locally in the browser.
- Chat history is kept in browser memory (future).
- Workflow data is processed locally.
- Communication with OpenAI follows their data usage policies.

---

## Links and Resources

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/mv3/getstarted/)

---