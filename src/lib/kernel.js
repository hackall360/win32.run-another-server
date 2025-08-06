import { installedPrograms, setInstalledPrograms, setQueueProgram } from './store.js';

class Kernel {
  constructor() {
    this.subsystems = new Map();
  }

  installProgram(program) {
    if (!program || !program.path) return;
    setInstalledPrograms(list => [...list, program]);
  }

  launchProgram(id, fsItem = {}) {
    const program = installedPrograms().find(p => p.id === id || p.name === id);
    if (program) {
      setQueueProgram({ path: program.path, fs_item: fsItem });
    }
  }

  registerSubsystem(name, api) {
    this.subsystems.set(name, api);
  }

  getSubsystem(name) {
    return this.subsystems.get(name);
  }
}

export const kernel = new Kernel();
export default kernel;
