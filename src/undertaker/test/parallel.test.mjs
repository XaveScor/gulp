import { promisify } from 'node:util';
import { describe, expect, test, beforeEach } from 'vitest';
import { disableDeprecationWarnings, resetDeprecationFlags } from '../../deprecation.mjs';

const { Gulp } = await import('../../gulp.cjs');

function fn1(done) {
  done(null, 1);
}

function fn2(done) {
  setTimeout(function () {
    done(null, 2);
  }, 500);
}

function fn3(done) {
  done(null, 3);
}

function fnError(done) {
  done(new Error('An Error Occurred'));
}

describe('undertaker: parallel', function () {
  let taker;

  beforeEach(async () => {
    disableDeprecationWarnings();
    resetDeprecationFlags();
    taker = new Gulp();
    taker.task('test1', fn1);
    taker.task('test2', fn2);
    taker.task('test3', fn3);
    taker.task('error', fnError);
  });

  test('should throw on non-valid tasks combined with valid tasks', async () => {
    function fail() {
      taker.parallel('test1', 'test2', 'test3', {});
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw on tasks array with both valid and non-valid tasks', async () => {
    function fail() {
      taker.parallel(['test1', 'test2', 'test3', {}]);
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw on non-valid task', async () => {
    function fail() {
      taker.parallel({});
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw when no tasks specified', async () => {
    function fail() {
      taker.parallel();
    }

    expect(fail).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should throw on empty array of registered tasks', async () => {
    function fail() {
      taker.parallel([]);
    }

    expect(fail).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should take only one array of registered tasks', async () => {
    const results = await promisify(taker.parallel(['test1', 'test2', 'test3']))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take all string names', async () => {
    const results = await promisify(taker.parallel('test1', 'test2', 'test3'))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take all functions', async () => {
    const results = await promisify(taker.parallel(fn1, fn2, fn3))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take string names and functions', async () => {
    const results = await promisify(taker.parallel('test1', fn2, 'test3'))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take nested parallel', async () => {
    const parallel1 = taker.parallel('test1', 'test2', 'test3');
    const results = await promisify(taker.parallel('test1', parallel1, 'test3'))();

    expect(results).toEqual([1, [1, 2, 3], 3]);
  });

  test('should stop processing on error', async () => {
    taker.on('error', function () {
      // To keep the test from catching the emitted errors
    });

    return new Promise((resolve) => {
      taker.parallel(
        'test1',
        'error',
        'test3',
      )(function (err, results) {
        expect(err).toBeInstanceOf(Error);
        expect(results).toEqual([1, undefined, 3]);
        resolve();
      });
    });
  });

  test('should throw on unregistered task', async () => {
    function unregistered() {
      taker.parallel('unregistered');
    }

    expect(unregistered).toThrow('Task never defined: unregistered');
  });

  test('should process all functions if settle flag is true', async () => {
    taker.on('error', function () {
      // To keep the test from catching the emitted errors
    });
    taker._settle = true;

    return new Promise((resolve) => {
      taker.parallel(
        taker.parallel('test1', 'error'),
        'test3',
      )(function (err, results) {
        expect(err[0][0]).toBeInstanceOf(Error);
        expect(results).toEqual([3]);
        resolve();
      });
    });
  });

  test('should not register a displayName on the returned function by default', async () => {
    const task = taker.parallel(fn1);
    expect(task.displayName).toEqual(undefined);
  });
});
