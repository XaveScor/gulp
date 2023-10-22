import { promisify } from 'node:util';
import { describe, expect, test, beforeEach, vi } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags, setDeprecationFlags } from '../../deprecation.mjs';

const { Gulp } = await import('../../gulp.cjs');

function noop(done) {
  done();
}

const anon = function () {};

describe('task', function () {
  let taker;

  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    taker = new Gulp();
  });

  test('should register a named function', () => {
    taker.task(noop);
    expect(taker.task('noop').unwrap()).toEqual(noop);
  });

  test('should register an anonymous function by string name', () => {
    taker.task('test1', anon);
    expect(taker.task('test1').unwrap()).toEqual(anon);
  });

  test('should register an anonymous function by displayName property', () => {
    anon.displayName = '<display name>';
    taker.task(anon);
    expect(taker.task('<display name>').unwrap()).toEqual(anon);
    delete anon.displayName;
  });

  test('should throw on register an anonymous function without string name', () => {
    function noName() {
      taker.task(function () {});
    }

    expect(noName).toThrow('Task name must be specified');
  });

  test('should register a named function by string name', () => {
    taker.task('test1', noop);
    expect(taker.task('test1').unwrap()).toEqual(noop);
  });

  test('should not get a task that was not registered', () => {
    expect(taker.task('test1')).toEqual(undefined);
  });

  test('should get a task that was registered', () => {
    taker.task('test1', noop);
    expect(taker.task('test1').unwrap()).toEqual(noop);
  });

  test('should get the wrapped task, not original function', () => {
    const registry = taker.registry();
    taker.task('test1', noop);
    expect(taker.task('test1').unwrap).toBeTypeOf('function');
    expect(taker.task('test1')).toEqual(registry.get('test1'));
  });

  test('provides an `unwrap` method to get the original function', () => {
    taker.task('test1', noop);
    expect(taker.task('test1').unwrap).toBeTypeOf('function');
    expect(taker.task('test1').unwrap()).toEqual(noop);
  });

  test('should return a function that was registered in some other way', () => {
    taker.registry()._tasks.test1 = noop;
    expect(taker.task('test1')).toEqual(noop);
  });

  test('should prefer displayName instead of name when both properties are defined', () => {
    function fn() {}
    fn.displayName = 'test1';
    taker.task(fn);
    expect(taker.task('test1').unwrap()).toEqual(fn);
  });

  test('should allow different tasks to refer to the same function', () => {
    function fn() {}
    taker.task('foo', fn);
    taker.task('bar', fn);
    expect(taker.task('foo').unwrap()).toEqual(taker.task('bar').unwrap());
  });

  test('[Deprecated: RunTaskOnce]should allow using aliased tasks in composite tasks', async () => {
    const fn = vi.fn((done) => done());

    taker.task('foo', fn);
    taker.task('bar', fn);

    const series = taker.series('foo', 'bar', function (cb) {
      expect(fn).toBeCalledTimes(2);
      cb();
    });

    const parallel = taker.parallel('foo', 'bar', function (cb) {
      setTimeout(function () {
        expect(fn).toBeCalledTimes(4);
        cb();
      }, 500);
    });

    await promisify(taker.series(series, parallel))();
  });

  test('should allow using aliased tasks in composite tasks', async () => {
    setDeprecationFlags({
      taskRunsOnce: true,
    });

    const fn = vi.fn((done) => done());

    taker.task('foo', fn);
    taker.task('bar', fn);

    const series = taker.series('foo', 'bar', function (cb) {
      expect(fn).toBeCalledTimes(2);
      cb();
    });

    const parallel = taker.parallel('foo', 'bar', function (cb) {
      setTimeout(function () {
        expect(fn).toBeCalledTimes(2);
        cb();
      }, 500);
    });

    await promisify(taker.series(series, parallel))();
  });

  test('[Deprecated: RunTaskOnce]should allow composite tasks tasks to be aliased', async () => {
    const fn1 = vi.fn((done) => done());
    const fn2 = vi.fn((done) => done());

    taker.task('ser', taker.series(fn1, fn2));
    taker.task('foo', taker.task('ser'));

    taker.task('par', taker.parallel(fn1, fn2));
    taker.task('bar', taker.task('par'));

    const series = taker.series('foo', function (cb) {
      expect(fn1).toBeCalledTimes(1);
      expect(fn2).toBeCalledTimes(1);
      cb();
    });

    const parallel = taker.series('bar', function (cb) {
      setTimeout(function () {
        expect(fn1).toBeCalledTimes(2);
        expect(fn2).toBeCalledTimes(2);
        cb();
      }, 500);
    });

    await promisify(taker.series(series, parallel))();
  });

  test('should allow composite tasks tasks to be aliased', async () => {
    setDeprecationFlags({
      taskRunsOnce: true,
    });

    const fn1 = vi.fn((done) => done());
    const fn2 = vi.fn((done) => done());

    taker.task('ser', taker.series(fn1, fn2));
    taker.task('foo', taker.task('ser'));

    taker.task('par', taker.parallel(fn1, fn2));
    taker.task('bar', taker.task('par'));

    const series = taker.series('foo', function (cb) {
      expect(fn1).toBeCalledTimes(1);
      expect(fn2).toBeCalledTimes(1);
      cb();
    });

    const parallel = taker.series('bar', function (cb) {
      setTimeout(function () {
        expect(fn1).toBeCalledTimes(1);
        expect(fn2).toBeCalledTimes(1);
        cb();
      }, 500);
    });

    await promisify(taker.series(series, parallel))();
  });
});
