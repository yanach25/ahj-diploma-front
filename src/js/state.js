export default class State {
  constructor() {
    this.store = [];
  }

  addMessages(messages, before = false) {
    this.store = before ? [...messages, ...this.store] : [...this.store, ...messages];
  }

  addMessage(message) {
    this.store.push(message);
  }
}
