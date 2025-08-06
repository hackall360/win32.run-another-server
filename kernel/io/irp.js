export class IRP {
  /**
   * @param {Object} options
   * @param {string} options.major Major function code
   * @param {string} [options.minor] Minor function code
   * @param {any} [options.data] Request payload
   */
  constructor({ major, minor = undefined, data = undefined } = {}) {
    this.majorFunction = major;
    this.minorFunction = minor;
    this.data = data;
    this.status = 0;
  }
}

export default IRP;
