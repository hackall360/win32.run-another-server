export class EventLog {
  constructor() {
    this.events = [];
  }

  log(type, message, data = {}) {
    const entry = {
      timestamp: new Date(),
      type,
      message,
      data
    };
    this.events.push(entry);
    return entry;
  }

  info(message, data) {
    return this.log('info', message, data);
  }

  error(message, error, data = {}) {
    return this.log('error', message, { error: error?.message, stack: error?.stack, ...data });
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events.length = 0;
  }
}

export const eventLog = new EventLog();
export const logEvent = (message, data) => eventLog.info(message, data);
export const logError = (message, error, data) => eventLog.error(message, error, data);
export default eventLog;
