export class CompletionPort {
  constructor() {
    this.associations = new Map(); // handle -> completionKey
    this.queue = [];
  }

  /**
   * Associate a handle with an optional completion key
   * @param {any} handle
   * @param {any} [completionKey]
   */
  associate(handle, completionKey = null) {
    this.associations.set(handle, completionKey);
  }

  /**
   * Post a completion packet to the queue for a handle
   * @param {any} handle
   * @param {any} result Data associated with the completion
   */
  post(handle, result) {
    const key = this.associations.get(handle);
    this.queue.push({ handle, key, result });
  }

  /**
   * Retrieve the next completion status packet
   * @returns {object|undefined}
   */
  getStatus() {
    return this.queue.shift();
  }
}

export function createCompletionPort() {
  return new CompletionPort();
}

export default CompletionPort;
