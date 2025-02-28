export type EventMap = {
  cellClick: (row: number, col: number) => boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export class EventManager<T extends Record<string, (...args: any[]) => boolean>> {
  private events: { 
    [K in keyof T]?: Array<{ handler: T[K]; priority: number }> 
  } = {};

  register<K extends keyof T>(eventType: K, handler: T[K], priority = 0) {
    if (!this.events[eventType]) {
      this.events[eventType] = [];
    }
    this.events[eventType]?.push({ handler, priority });

    this.events[eventType]?.sort((a, b) => b.priority - a.priority);
  }


  unregister<K extends keyof T>(eventType: K, handler: T[K]) {
    if (this.events[eventType]) {
      this.events[eventType] = this.events[eventType]?.filter(
        (entry) => entry.handler !== handler
      );
    }
  }

  trigger<K extends keyof T>(eventType: K, ...args: Parameters<T[K]>): boolean {
    if (!this.events[eventType]) return false;


    for (const { handler } of this.events[eventType] ?? []) {
      const result = (handler as (...args: unknown[]) => unknown)(...args)
      
      if (typeof result === "boolean" && result) {
        return true;
      }
    }
    return false;
  }
}














