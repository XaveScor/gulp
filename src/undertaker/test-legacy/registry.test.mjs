import { promisify } from 'node:util';
import { describe, expect, test, beforeEach } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';

const { default: DefaultRegistry } = await import('undertaker-registry');
const { default: CommonRegistry } = await import('undertaker-common-tasks');
const { default: MetadataRegistry } = await import('undertaker-task-metadata');

const { Gulp } = await import('../../gulp.cjs');

function noop() {}

function CustomRegistry() {}
CustomRegistry.prototype.init = noop;
CustomRegistry.prototype.get = noop;
CustomRegistry.prototype.set = noop;
CustomRegistry.prototype.tasks = noop;

function SetNoReturnRegistry() {
  this._tasks = {};
}
SetNoReturnRegistry.prototype.init = noop;
SetNoReturnRegistry.prototype.get = function (name) {
  return this.tasks[name];
};
SetNoReturnRegistry.prototype.set = function (name, fn) {
  this.tasks[name] = fn;
};
SetNoReturnRegistry.prototype.tasks = noop;

function InvalidRegistry() {}

describe('registry', function () {
  beforeEach(() => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
  });
  describe('method', function () {
    test('should return the current registry when no arguments are given', () => {
      const taker = new Gulp();
      expect(taker.registry()).toEqual(taker._registry);
    });

    test('should set the registry to the given registry instance argument', () => {
      const taker = new Gulp();
      const customRegistry = new CustomRegistry();
      taker.registry(customRegistry);
      expect(taker.registry()).toEqual(customRegistry);
    });

    test('should validate the custom registry instance', () => {
      const taker = new Gulp();
      const invalid = new InvalidRegistry();

      function invalidSet() {
        taker.registry(invalid);
      }

      expect(invalidSet).toThrow('Custom registry must have `get` function');
    });

    test('should transfer all tasks from old registry to new', () => {
      const taker = new Gulp(new CommonRegistry());
      const customRegistry = new DefaultRegistry();
      taker.registry(customRegistry);

      expect(taker.task('clean')).toBeTypeOf('function');
      expect(taker.task('serve')).toBeTypeOf('function');
    });

    test('allows multiple custom registries to used', async () => {
      return new Promise((resolve) => {
        const taker = new Gulp();
        taker.registry(new CommonRegistry());

        expect(taker.task('clean')).toBeTypeOf('function');
        expect(taker.task('serve')).toBeTypeOf('function');

        taker.registry(new MetadataRegistry());
        taker.task('context', function (cb) {
          expect(this).toEqual({ name: 'context' });
          cb();
          resolve();
        });

        taker.registry(new DefaultRegistry());

        expect(taker.task('clean')).toBeTypeOf('function');
        expect(taker.task('serve')).toBeTypeOf('function');
        expect(taker.task('context')).toBeTypeOf('function');

        taker.series('context')();
      });
    });

    test('throws with a descriptive method when constructor is passed', () => {
      const taker = new Gulp();

      function ctor() {
        taker.registry(CommonRegistry);
      }

      expect(ctor).toThrow('Custom registries must be instantiated, but it looks like you passed a constructor');
    });

    test('calls into the init function after tasks are transferred', () => {
      const taker = new Gulp(new CommonRegistry());

      const ogInit = DefaultRegistry.prototype.init;

      DefaultRegistry.prototype.init = function (inst) {
        expect(inst).toEqual(taker);
        expect(inst.task('clean')).toBeTypeOf('function');
        expect(inst.task('serve')).toBeTypeOf('function');
      };

      taker.registry(new DefaultRegistry());

      DefaultRegistry.prototype.init = ogInit;
    });
  });

  describe('constructor', function () {
    test('should take a custom registry on instantiation', () => {
      const taker = new Gulp(new CustomRegistry());
      expect(taker.registry()).toBeInstanceOf(CustomRegistry);
      expect(taker.registry()).not.toBeInstanceOf(DefaultRegistry);
    });

    test('should default to undertaker-registry if not constructed with custom registry', () => {
      const taker = new Gulp();
      expect(taker.registry()).toBeInstanceOf(DefaultRegistry);
      expect(taker.registry()).not.toBeInstanceOf(CustomRegistry);
    });

    test('should take a registry that pre-defines tasks', () => {
      const taker = new Gulp(new CommonRegistry());
      expect(taker.registry()).toBeInstanceOf(CommonRegistry);
      expect(taker.registry()).toBeInstanceOf(DefaultRegistry);
      expect(taker.task('clean')).toBeTypeOf('function');
      expect(taker.task('serve')).toBeTypeOf('function');
    });

    test('should throw upon invalid registry', () => {
      /* eslint no-unused-vars: 0 */
      let taker;

      function noGet() {
        taker = new Gulp(new InvalidRegistry());
      }

      expect(noGet).toThrow('Custom registry must have `get` function');
      InvalidRegistry.prototype.get = noop;

      function noSet() {
        taker = new Gulp(new InvalidRegistry());
      }

      expect(noSet).toThrow('Custom registry must have `set` function');
      InvalidRegistry.prototype.set = noop;

      function noInit() {
        taker = new Gulp(new InvalidRegistry());
      }

      expect(noInit).toThrow('Custom registry must have `init` function');
      InvalidRegistry.prototype.init = noop;

      function noTasks() {
        taker = new Gulp(new InvalidRegistry());
      }

      expect(noTasks).toThrow('Custom registry must have `tasks` function');
      InvalidRegistry.prototype.tasks = noop;

      taker = new Gulp(new InvalidRegistry());
    });
  });

  test('does not require the `set` method to return a task', async () => {
    return new Promise((resolve) => {
      const taker = new Gulp();
      taker.registry(new SetNoReturnRegistry());
      taker.task('test', noop);
      taker.on('start', function (data) {
        expect(data.name).toEqual('test');
        resolve();
      });
      taker.series('test')();
    });
  });

  test('should fail and offer tasks which are close in name', () => {
    const taker = new Gulp(new CommonRegistry());
    const customRegistry = new DefaultRegistry();
    taker.registry(customRegistry);

    function fail() {
      taker.series('clear');
    }

    expect(fail).toThrow(/Task never defined: clear - did you mean\? clean/);
  });
});
