// State management utility
export class StateManager {
  constructor() {
    this.state = {
      isChatWindowVisible: false,
      isChatMessagesVisible: false,
      isPlusMenuVisible: false,
      isChatVisible: false,
      areButtonsVisible: false,
      chatMessages: [],
      attachedFiles: []
    };
  }

  // Get state value
  get(key) {
    return this.state[key];
  }

  // Set state value
  set(key, value) {
    this.state[key] = value;
  }

  // Update multiple state values
  update(updates) {
    Object.assign(this.state, updates);
  }

  // Reset state
  reset() {
    this.state = {
      isChatWindowVisible: false,
      isChatMessagesVisible: false,
      isPlusMenuVisible: false,
      isChatVisible: false,
      areButtonsVisible: false,
      chatMessages: [],
      attachedFiles: []
    };
  }

  // Get all state
  getAll() {
    return { ...this.state };
  }
}
