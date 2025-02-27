type CellClickHandler = (row: number, col: number) => boolean;

export class EventManager {
  private events: {
    [key: string]: { handler: Function; priority: number }[];
  } = {};

  // Register an event handler with optional priority (higher priority runs first)
  register(eventType: string, handler: Function, priority: number = 0) {
    if (!this.events[eventType]) {
      this.events[eventType] = [];
    }
    this.events[eventType].push({ handler, priority });

    // Sort handlers by priority (higher number = higher priority)
    this.events[eventType].sort((a, b) => b.priority - a.priority);
  }

  // Unregister an event handler
  unregister(eventType: string, handler: Function) {
    if (this.events[eventType]) {
      this.events[eventType] = this.events[eventType].filter(
        (entry) => entry.handler !== handler
      );
    }
  }

  // Trigger an event and stop if any handler returns `true`
  trigger(eventType: string, ...args: any[]) {
    if (!this.events[eventType]) return;

    for (const { handler } of this.events[eventType]) {
      if (handler(...args)) {
        return true; // Stop execution if a handler returns true
      }
    }
    return false;
  }
}

