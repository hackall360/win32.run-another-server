export class PnPManager {
  constructor() {
    this.devices = new Map();
    this.listeners = new Set();
    this.resourceCounter = 0;
  }

  enumerate() {
    return Array.from(this.devices.values());
  }

  onHotPlug(listener) {
    this.listeners.add(listener);
  }

  offHotPlug(listener) {
    this.listeners.delete(listener);
  }

  addDevice(device) {
    const dev = { ...device, resourceId: ++this.resourceCounter };
    this.devices.set(dev.id, dev);
    for (const l of this.listeners) {
      l({ type: 'add', device: dev });
    }
  }

  removeDevice(id) {
    const dev = this.devices.get(id);
    if (!dev) return;
    this.devices.delete(id);
    for (const l of this.listeners) {
      l({ type: 'remove', device: dev });
    }
  }

  reset() {
    this.devices.clear();
    this.resourceCounter = 0;
  }
}

export const pnpManager = new PnPManager();
export default pnpManager;
