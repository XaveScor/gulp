import { promisify } from 'node:util';
import { describe, expect, test, beforeEach } from 'vitest';

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

describe('series', function () {
  var taker;

  beforeEach(() => {
    taker = new Gulp();
    taker.task('test1', fn1);
    taker.task('test2', fn2);
    taker.task('test3', fn3);
    taker.task('error', fnError);
  });

  test('should throw on non-valid tasks combined with valid tasks', () => {
    function fail() {
      taker.series('test1', 'test2', 'test3', {});
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw on tasks array with both valid and non-valid tasks', () => {
    function fail() {
      taker.series(['test1', 'test2', 'test3', {}]);
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw on non-valid task', () => {
    function fail() {
      taker.series({});
    }

    expect(fail).toThrow(/Task never defined:/);
  });

  test('should throw when no tasks specified', () => {
    function fail() {
      taker.series();
    }

    expect(fail).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should throw on empty array of registered tasks', () => {
    function fail() {
      taker.series([]);
    }

    expect(fail).toThrow(/One or more tasks should be combined using series or parallel/);
  });

  test('should take only one array of registered tasks', async () => {
    const results = await promisify(taker.series(['test1', 'test2', 'test3']))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take all string names', async () => {
    const results = await promisify(taker.series('test1', 'test2', 'test3'))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take all functions', async () => {
    const results = await promisify(taker.series(fn1, fn2, fn3))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take string names and functions', async () => {
    const results = await promisify(taker.series('test1', fn2, 'test3'))();

    expect(results).toEqual([1, 2, 3]);
  });

  test('should take nested series', async () => {
    const series1 = taker.series('test1', 'test2', 'test3');
    const results = await promisify(taker.series('test1', series1, 'test3'))();

    expect(results).toEqual([1, [1, 2, 3], 3]);
  });

  test('should stop processing on error', async () => {
    taker.on('error', function () {
      // To keep the test from catching the emitted errors
    });

    return new Promise((resolve) => {
      taker.series(
        'test1',
        'error',
        'test3',
      )(function (err, results) {
        expect(err).toBeInstanceOf(Error);
        expect(results).toEqual([1, undefined, undefined]);
        resolve();
      });
    });
  });

  test('should throw on unregistered task', () => {
    function unregistered() {
      taker.series('unregistered');
    }

    expect(unregistered).toThrow('Task never defined: unregistered');
  });

  test('should process all functions if settle flag is true', async () => {
    taker.on('error', function () {
      // To keep the test from catching the emitted errors
    });
    taker._settle = true;

    return new Promise((resolve) => {
      taker.series(
        taker.series('test1', 'error'),
        'test3',
      )(function (err, results) {
        expect(err[0][0]).toBeInstanceOf(Error);
        expect(results).toEqual([3]);
        resolve();
      });
    });
  });

  test('should not register a displayName on the returned function by default', () => {
    const task = taker.series(fn1);
    expect(task.displayName).toEqual(undefined);
  });
});
