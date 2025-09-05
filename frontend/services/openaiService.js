// OpenAI API service
export class OpenAIService {
  constructor(chatMessages) {
    this.chatMessages = chatMessages;
  }

  async sendMessage(message, messageId, chatMessages) {
    try {
      // Get API key and model from chrome storage
      const result = await new Promise((resolve) => {
        chrome.storage.sync.get(['openaiApiKey', 'provider', 'model'], resolve);
      });
      
      const apiKey = result.openaiApiKey;
      const provider = result.provider || 'openai';
      const model = result.model || 'gpt-4o-mini';
      
      if (!apiKey) {
        this.chatMessages.updateMessageContent(messageId, '❌ OpenAI API key not found. Please set your API key in the extension settings.');
        return;
      }
      
      // Prepare messages for API
      const messages = [
        {
          role: 'system',
          content: 'You are 8pilot AI, an expert assistant for n8n workflow automation. You help users create, optimize, and troubleshoot n8n workflows. Be helpful, concise, and provide actionable advice.'
        }
      ];
      
      // Add previous messages for context (last 10 messages)
      const recentMessages = chatMessages
        .filter(msg => msg.content && msg.role !== 'system')
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      messages.push(...recentMessages);
      messages.push({ role: 'user', content: message });
      
      // Make API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          stream: true,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                assistantResponse += delta;
                this.chatMessages.updateMessageContent(messageId, assistantResponse);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
      
      // If no response was received, show error
      if (!assistantResponse) {
        this.chatMessages.updateMessageContent(messageId, '❌ No response received from OpenAI API');
      }
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      this.chatMessages.updateMessageContent(messageId, `❌ Error: ${error.message}. Please check your API key and try again.`);
    }
  }
}
