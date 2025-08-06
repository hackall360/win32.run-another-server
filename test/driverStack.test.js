import { test } from 'node:test';
import assert from 'node:assert';
import { DriverStack, IRP } from '../kernel/io/index.js';
import Driver from '../kernel/io/drivers/base.js';

test('IRPs traverse driver stacks', () => {
  const stack = new DriverStack();
  const calls = [];
  class Upper extends Driver {
    handleIrp(irp, next) {
      calls.push('upper');
      irp.data.push('upper');
      return next();
    }
  }
  class Lower extends Driver {
    handleIrp(irp) {
      calls.push('lower');
      irp.data.push('lower');
      irp.status = 42;
      return irp.status;
    }
  }
  stack.addDriver(new Upper('upper'));
  stack.addDriver(new Lower('lower'));
  const irp = new IRP({ major: 'read', data: [] });
  const status = stack.send(irp);
  assert.deepStrictEqual(calls, ['upper', 'lower']);
  assert.deepStrictEqual(irp.data, ['upper', 'lower']);
  assert.strictEqual(status, 42);
});
